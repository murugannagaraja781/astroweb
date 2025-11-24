const request = require('supertest');
const express = require('express');
const otpRoutes = require('../routes/otpRoutes');

// Mock the controller
jest.mock('../controllers/otpController');
const { sendOtp, verifyOtp } = require('../controllers/otpController');

describe('OTP Routes', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/otp', otpRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/otp/send', () => {
        test('should call sendOtp controller', async () => {
            sendOtp.mockImplementation((req, res) => {
                res.json({ type: 'success', message: 'OTP sent successfully' });
            });

            const response = await request(app)
                .post('/api/otp/send')
                .send({ phoneNumber: '9876543210' });

            expect(sendOtp).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.type).toBe('success');
        });

        test('should return 400 for invalid phone number', async () => {
            sendOtp.mockImplementation((req, res) => {
                res.status(400).json({ msg: 'Please provide a valid phone number' });
            });

            const response = await request(app)
                .post('/api/otp/send')
                .send({ phoneNumber: '123' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/otp/verify', () => {
        test('should call verifyOtp controller', async () => {
            verifyOtp.mockImplementation((req, res) => {
                res.json({
                    type: 'success',
                    token: 'fake-jwt-token',
                    user: { id: '1', name: 'Test User' }
                });
            });

            const response = await request(app)
                .post('/api/otp/verify')
                .send({
                    phoneNumber: '9876543210',
                    otp: '123456'
                });

            expect(verifyOtp).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.type).toBe('success');
            expect(response.body.token).toBeDefined();
        });

        test('should return 400 for missing OTP', async () => {
            verifyOtp.mockImplementation((req, res) => {
                res.status(400).json({ msg: 'Phone number and OTP are required' });
            });

            const response = await request(app)
                .post('/api/otp/verify')
                .send({ phoneNumber: '9876543210' });

            expect(response.status).toBe(400);
        });
    });
});
