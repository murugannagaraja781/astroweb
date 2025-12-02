import { useState } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle, XCircle, Loader, Info } from 'lucide-react';

const PhonePeTest = () => {
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [configTest, setConfigTest] = useState(null);

  const testConfiguration = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment/phonepe/test`);
      setConfigTest(res.data);
    } catch (error) {
      setConfigTest({
        success: false,
        error: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setTestResult(null);

    const token = localStorage.getItem('token');
const res = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/payment/phonepe/initiate`,
  {
    amount: parseFloat(amount),
    userId: 'TEST_USER_123',
    userName: 'Test User',
    mobileNumber: '9999999999'
  },
  {
    headers: {
      'x-auth-token': token
    }
  }
);


      setTestResult(res.data);

      // If payment URL is available, open it in new tab
      if (res.data.paymentUrl) {
        window.open(res.data.paymentUrl, '_blank');
      }

    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.error || error.message,
        details: error.response?.data?.details
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">PhonePe Payment Test</h1>
              <p className="text-gray-400 text-sm">Test PhonePe integration</p>
            </div>
          </div>

          {/* Configuration Test */}
          <div className="mb-6">
            <button
              onClick={testConfiguration}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Info className="w-5 h-5" />}
              Test Configuration
            </button>

            {configTest && (
              <div className={`mt-4 p-4 rounded-lg border ${
                configTest.success
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-red-900/20 border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  {configTest.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold mb-2 ${configTest.success ? 'text-green-300' : 'text-red-300'}`}>
                      {configTest.message || 'Configuration Test Failed'}
                    </p>
                    {configTest.config && (
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>Merchant ID: <span className="font-mono text-purple-300">{configTest.config.merchantId}</span></p>
                        <p>Salt Key: <span className={configTest.config.saltKeyConfigured ? 'text-green-400' : 'text-red-400'}>
                          {configTest.config.saltKeyConfigured ? '✓ Configured' : '✗ Missing'}
                        </span></p>
                        <p>Environment: <span className="font-mono text-blue-300">{configTest.config.environment}</span></p>
                      </div>
                    )}
                    {configTest.error && (
                      <p className="text-red-300 text-sm mt-2">{configTest.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-white/10 my-6"></div>

          {/* Payment Test */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Enter amount"
                min="1"
              />
            </div>

            <button
              onClick={initiatePayment}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Initiate Payment
                </>
              )}
            </button>
          </div>

          {/* Result Display */}
          {testResult && (
            <div className={`mt-6 p-4 rounded-lg border ${
              testResult.success
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold mb-2 ${testResult.success ? 'text-green-300' : 'text-red-300'}`}>
                    {testResult.success ? 'Payment Initiated Successfully!' : 'Payment Failed'}
                  </p>
                  {testResult.transactionId && (
                    <p className="text-sm text-gray-300 mb-2">
                      Transaction ID: <span className="font-mono text-purple-300">{testResult.transactionId}</span>
                    </p>
                  )}
                  {testResult.paymentUrl && (
                    <p className="text-sm text-blue-300">
                      Payment page opened in new tab
                    </p>
                  )}
                  {testResult.error && (
                    <div className="mt-2">
                      <p className="text-red-300 text-sm font-semibold">{testResult.error}</p>
                      {testResult.details && (
                        <pre className="mt-2 text-xs text-gray-400 bg-black/20 p-2 rounded overflow-auto">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-blue-300 mb-2">Testing Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click "Test Configuration" to verify PhonePe setup</li>
                  <li>Enter an amount (e.g., 100)</li>
                  <li>Click "Initiate Payment"</li>
                  <li>Payment page will open in new tab (Sandbox mode)</li>
                  <li>Use test credentials to complete payment</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhonePeTest;
