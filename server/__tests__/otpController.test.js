const axios = require('axios');
const { sendOtp, verifyOtp } = require('../controllers/otpController');

jest.mock('axios');
jest.mock('../models/User');
jest.mock('../models/Wallet');

describe('OTP Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            body: {}
        };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('sendOtp', () => {
        test('should send OTP successfully', async () => {
            mockReq.body = { phoneNumber: '9876543210' };

            axios.post.mockResolvedValue({
                data: { type: 'success' }
            });

            await sendOtp(mockReq, mockRes);

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('msg91.com'),
                expect.any(Object),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'authkey': expect.any(String)
                    })
                })
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                type: 'success',
                message: 'OTP sent successfully'
            });
        });

        test('should return 400 for invalid phone number', async () => {
            mockReq.body = { phoneNumber: '123' };

            await sendOtp(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                msg: 'Please provide a valid phone number'
            });
        });

        test('should handle MSG91 API errors', async () => {
            mockReq.body = { phoneNumber: '9876543210' };

            axios.post.mockRejectedValue({
                response: {
                    data: { message: 'API Error' }
                }
            });

            await sendOtp(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                msg: 'Error sending OTP',
                error: 'API Error'
            });
        });
    });

    describe('verifyOtp', () => {
        test('should return 400 when phone number is missing', async () => {
            mockReq.body = { otp: '123456' };

            await verifyOtp(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                msg: 'Phone number and OTP are required'
            });
        });

        test('should return 400 when OTP is missing', async () => {
            mockReq.body = { phoneNumber: '9876543210' };

            await verifyOtp(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                mg: 'Phone number and OTP are required'
            });
        });

        test('should handle MSG91 verification errors', async () => {
            mockReq.body = { phoneNumber: '9876543210', otp: '123456' };

            axios.get.mockRejectedValue({
                response: {
                    data: { message: 'Invalid OTP' }
                }
            });

            await verifyOtp(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
