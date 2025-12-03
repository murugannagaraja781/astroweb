const axios = require('axios');

const API_URL = 'https://astroweb-production.up.railway.app/api';

async function testOffersAndBanners() {
    try {
        // 1. Login as Admin
        console.log('Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@gmail.com',
            password: 'Admin@2026'
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        const config = {
            headers: {
                'x-auth-token': token
            }
        };

        // 2. Test Offers
        console.log('\nTesting Offers...');
        const offerData = {
            title: 'Summer Special',
            code: 'SUMMER20',
            discount: 20,
            type: 'percentage',
            validUntil: '2024-12-31',
            description: 'Get 20% off'
        };
        const addOfferRes = await axios.post(`${API_URL}/admin/offers`, offerData, config);
        console.log('Add Offer Response:', addOfferRes.data);

        const getOffersRes = await axios.get(`${API_URL}/admin/offers`, config);
        console.log(`Fetched ${getOffersRes.data.length} offers.`);

        if (getOffersRes.data.length > 0) {
            const offerId = getOffersRes.data[0]._id;
            await axios.delete(`${API_URL}/admin/offers/${offerId}`, config);
            console.log('✅ Offers verified.');
        } else {
            console.error('❌ Offers verification failed.');
        }

        // 3. Test Banners
        console.log('\nTesting Banners...');
        const bannerData = {
            title: 'Special Discount',
            subtitle: 'Get 50% off',
            image: 'http://example.com/banner.jpg',
            targetUrl: '/offers/special',
            isActive: true
        };
        const addBannerRes = await axios.post(`${API_URL}/admin/banners`, bannerData, config);
        console.log('Add Banner Response:', addBannerRes.data);

        const getBannersRes = await axios.get(`${API_URL}/admin/banners`, config);
        console.log(`Fetched ${getBannersRes.data.length} banners.`);

        if (getBannersRes.data.length > 0) {
            const bannerId = getBannersRes.data[0]._id;
            await axios.delete(`${API_URL}/admin/banners/${bannerId}`, config);
            console.log('✅ Banners verified.');
        } else {
            console.error('❌ Banners verification failed.');
        }

        // 4. Test Recent Logins
        console.log('\nTesting Recent Logins...');
        // We just logged in, so we should appear in recent logins
        const recentLoginsRes = await axios.get(`${API_URL}/admin/recent-logins`, config);
        console.log('Recent Logins:', recentLoginsRes.data);

        if (recentLoginsRes.data.length > 0 && recentLoginsRes.data[0].email === 'admin@gmail.com') {
            console.log('✅ Recent logins verified.');
        } else {
            console.error('❌ Recent logins verification failed.');
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testOffersAndBanners();
