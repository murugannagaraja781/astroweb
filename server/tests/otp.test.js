// Jest tests for OTP send and verify endpoints
// Uses supertest to make HTTP requests to the Express app
// Mocks axios to simulate MSG91 API responses

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

// Mock environment variables
process.env.MSG91_AUTHKEY = 'test_auth_key';
process.env.JWT_SECRET = 'test_jwt_secret';

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Import the router after mocking dependencies
const otpRouter = require('../routes/otpRoutes');

// Setup Express app for testing
const app = express();
app.use(bodyParser.json());
app.use('/api/otp', otpRouter);

describe('OTP Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/otp/send', () => {
        it('should send OTP successfully with valid phone', async () => {
            // Mock MSG91 send OTP response
            axios.post.mockResolvedValue({
                data: { type: 'success', message: 'OTP sent' },
            });

            const res = await request(app)
                .post('/api/otp/send')
                .send({ phoneNumber: '9876543210' })
                .expect(200);

            expect(res.body.type).toBe('success');
            expect(res.body.message).toBe('OTP sent successfully');
            expect(axios.post).toHaveBeenCalledTimes(1);
        });

        it('should return 400 for invalid phone number', async () => {
            const res = await request(app)
                .post('/api/otp/send')
                .send({ phoneNumber: '123' })
                .expect(400);

            expect(res.body.msg).toBe('Invalid phone number');
        });
    });

    describe('POST /api/otp/verify', () => {
        it('should verify OTP and return JWT token', async () => {
            // Mock MSG91 verify OTP response
            axios.get.mockResolvedValue({
                data: { type: 'success' },
            });

            // Mock User model methods
            const User = require('../models/User');
            const Wallet = require('../models/Wallet');
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            jest.spyOn(User.prototype, 'save').mockResolvedValue();
            jest.spyOn(Wallet.prototype, 'save').mockResolvedValue();

            const res = await request(app)
                .post('/api/otp/verify')
                .send({ phoneNumber: '9876543210', otp: '123456' })
                .expect(200);

            expect(res.body.type).toBe('success');
            expect(res.body.token).toBeDefined();
            // Verify token can be decoded
            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
            expect(decoded.user.id).toBeDefined();
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app)
                .post('/api/otp/verify')
                .send({ phoneNumber: '9876543210' })
                .expect(400);

            expect(res.body.msg).toBe('Phone number and OTP are required');
        });
    });
});
