const axios = require('axios');
const jwt = require('jsonwebtoken');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

// Mock dependencies
jest.mock('axios');
jest.mock('../models/User');
jest.mock('../models/Wallet');
jest.mock('jsonwebtoken');

describe('OTP Controller Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      body: {}
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Set environment variables
    process.env.MSG91_AUTHKEY = '478312AgHesvjV691c86b3P1';
    process.env.MSG91_TEMPLATE_ID = '1407172294566795685';
    process.env.MSG91_SENDER_ID = 'ASTRO9';
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('sendOtp', () => {
    test('should send OTP successfully with valid phone number', async () => {
      req.body = { phoneNumber: '9876543210' };

      axios.post.mockResolvedValue({
        data: { type: 'success', message: 'OTP sent' }
      });

      await sendOtp(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('https://control.msg91.com/api/v5/otp'),
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            template_id: '1407172294566795685',
            mobile: '919876543210',
            authkey: '478312AgHesvjV691c86b3P1',
            sender: 'ASTRO9'
          })
        })
      );

      expect(res.json).toHaveBeenCalledWith({
        type: 'success',
        message: 'OTP sent successfully',
        phone: '9876543210'
      });
    });

    test('should return error for invalid phone number (too short)', async () => {
      req.body = { phoneNumber: '12345' };

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Please provide a valid phone number'
      });
    });

    test('should return error for missing phone number', async () => {
      req.body = {};

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Please provide a valid phone number'
      });
    });

    test('should clean phone number (remove spaces and dashes)', async () => {
      req.body = { phoneNumber: '987-654-3210' };

      axios.post.mockResolvedValue({
        data: { type: 'success' }
      });

      await sendOtp(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            mobile: '919876543210'
          })
        })
      );
    });

    test('should return error for non-10-digit phone number', async () => {
      req.body = { phoneNumber: '987654321' }; // 9 digits

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Phone number must be 10 digits'
      });
    });

    test('should handle MSG91 API error', async () => {
      req.body = { phoneNumber: '9876543210' };

      axios.post.mockRejectedValue({
        response: {
          data: { message: 'Invalid auth key' }
        }
      });

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error sending OTP'
        })
      );
    });

    test('should handle MSG91 failure response', async () => {
      req.body = { phoneNumber: '9876543210' };

      axios.post.mockResolvedValue({
        data: { type: 'error', message: 'Template not found' }
      });

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Failed to send OTP',
        details: { type: 'error', message: 'Template not found' }
      });
    });
  });

  describe('verifyOtp', () => {
    test('should verify OTP and login existing user', async () => {
      req.body = { phoneNumber: '9876543210', otp: '123456' };

      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        role: 'client'
      };

      axios.get.mockResolvedValue({
        data: { type: 'success' }
      });

      User.findOne.mockResolvedValue(mockUser);

      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, 'mock_jwt_token');
      });

      await verifyOtp(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://control.msg91.com/api/v5/otp/verify'),
        expect.objectContaining({
          headers: {
            authkey: '478312AgHesvjV691c86b3P1'
          }
        })
      );

      expect(User.findOne).toHaveBeenCalledWith({ phone: '9876543210' });

      expect(res.json).toHaveBeenCalledWith({
        type: 'success',
        token: 'mock_jwt_token',
        user: mockUser
      });
    });

    test('should create new user if not exists', async () => {
      req.body = { phoneNumber: '9876543210', otp: '123456' };

      const mockNewUser = {
        _id: 'newuser123',
        name: 'User_9876543210',
        email: '9876543210@phone.user',
        phone: '9876543210',
        role: 'client',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockWallet = {
        userId: 'newuser123',
        save: jest.fn().mockResolvedValue(true)
      };

      axios.get.mockResolvedValue({
        data: { type: 'success' }
      });

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => mockNewUser);
      Wallet.mockImplementation(() => mockWallet);

      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, 'mock_jwt_token');
      });

      await verifyOtp(req, res);

      expect(mockNewUser.save).toHaveBeenCalled();
      expect(mockWallet.save).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          token: 'mock_jwt_token'
        })
      );
    });

    test('should return error for missing phone number', async () => {
      req.body = { otp: '123456' };

      await verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Phone number and OTP are required'
      });
    });

    test('should return error for missing OTP', async () => {
      req.body = { phoneNumber: '9876543210' };

      await verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Phone number and OTP are required'
      });
    });

    test('should return error for invalid OTP', async () => {
      req.body = { phoneNumber: '9876543210', otp: '999999' };

      axios.get.mockResolvedValue({
        data: { type: 'error', message: 'Invalid OTP' }
      });

      await verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Invalid OTP',
        details: { type: 'error', message: 'Invalid OTP' }
      });
    });

    test('should handle MSG91 verification API error', async () => {
      req.body = { phoneNumber: '9876543210', otp: '123456' };

      axios.get.mockRejectedValue({
        response: {
          data: { message: 'OTP expired' }
        }
      });

      await verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Error verifying OTP'
        })
      );
    });

    test('should handle JWT signing error', async () => {
      req.body = { phoneNumber: '9876543210', otp: '123456' };

      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        phone: '9876543210',
        role: 'client'
      };

      axios.get.mockResolvedValue({
        data: { type: 'success' }
      });

      User.findOne.mockResolvedValue(mockUser);

      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(new Error('JWT signing failed'), null);
      });

      await expect(verifyOtp(req, res)).rejects.toThrow('JWT signing failed');
    });
  });

  describe('Phone Number Cleaning', () => {
    test('should handle phone with spaces', async () => {
      req.body = { phoneNumber: '987 654 3210' };

      axios.post.mockResolvedValue({
        data: { type: 'success' }
      });

      await sendOtp(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            mobile: '919876543210'
          })
        })
      );
    });

    test('should handle phone with +91 prefix', async () => {
      req.body = { phoneNumber: '+919876543210' };

      axios.post.mockResolvedValue({
        data: { type: 'success' }
      });

      await sendOtp(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            mobile: '919876543210'
          })
        })
      );
    });

    test('should handle phone with parentheses', async () => {
      req.body = { phoneNumber: '(987) 654-3210' };

      axios.post.mockResolvedValue({
        data: { type: 'success' }
      });

      await sendOtp(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            mobile: '919876543210'
          })
        })
      );
    });
  });
});
