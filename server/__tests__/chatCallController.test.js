const { storeChatCall, getChatCall } = require('../controllers/chatController');
const ChatSession = require('../models/ChatSession');
const httpMocks = require('node-mocks-http');

jest.mock('../models/ChatSession');

describe('Chat Call Controller', () => {
    let req, res;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        jest.clearAllMocks();
    });

    describe('storeChatCall', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { userId: '123' }; // Missing others
            await storeChatCall(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ msg: "Missing required fields" });
        });

        it('should update existing session', async () => {
            req.body = { userId: 'u1', astrologerId: 'a1', sessionId: 's1', initiatedAt: new Date() };
            const mockSession = { save: jest.fn() };
            ChatSession.findOne.mockResolvedValue(mockSession);

            await storeChatCall(req, res);

            expect(ChatSession.findOne).toHaveBeenCalledWith({ sessionId: 's1' });
            expect(mockSession.status).toBe('active');
            expect(mockSession.save).toHaveBeenCalled();
            expect(res.statusCode).toBe(200);
        });

        it('should create new session if not found', async () => {
            req.body = { userId: 'u1', astrologerId: 'a1', sessionId: 's1', initiatedAt: new Date() };
            ChatSession.findOne.mockResolvedValue(null);
            ChatSession.create.mockResolvedValue({ sessionId: 's1', status: 'active' });

            await storeChatCall(req, res);

            expect(ChatSession.create).toHaveBeenCalled();
            expect(res.statusCode).toBe(200);
        });
    });

    describe('getChatCall', () => {
        it('should return 400 if sessionId is missing', async () => {
            req.query = {};
            await getChatCall(req, res);
            expect(res.statusCode).toBe(400);
        });

        it('should return 404 if session not found', async () => {
            req.query = { sessionId: 's1' };
            const mockQuery = { populate: jest.fn().mockReturnThis(), populate: jest.fn().mockResolvedValue(null) };
            ChatSession.findOne.mockReturnValue({ populate: jest.fn().mockReturnValue(mockQuery) }); // Mock chain

            // Simplified mock for chaining
            ChatSession.findOne.mockImplementation(() => ({
                populate: () => ({
                    populate: () => null
                })
            }));

            await getChatCall(req, res);
            expect(res.statusCode).toBe(404);
        });

        it('should return session if found', async () => {
            req.query = { sessionId: 's1' };
            const mockSession = { sessionId: 's1' };

            ChatSession.findOne.mockImplementation(() => ({
                populate: () => ({
                    populate: () => mockSession
                })
            }));

            await getChatCall(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual(mockSession);
        });
    });
});
