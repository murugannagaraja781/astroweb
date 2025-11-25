# Database Update Scripts - Summary

## ✅ Script 1: Add ₹100 to All Clients

**File**: `server/scripts/addBalanceToClients.js`

**What it does**:
- Finds all users with role='client'
- Adds ₹100 to their wallet balance
- Creates transaction record: "Admin Bonus - ₹100 added to all clients"

**Results**:
```
✅ Added ₹100 to 4 clients:
- Nagaraja Murugan (nagarajanewlife@gmail.com)
- Nagaraja Murugan (naga@gmail.com)
- Abinash K (abinash818@gmail.com)
- raja (raja@gmail.com)
```

**Run again**: `cd server && node scripts/addBalanceToClients.js`

---

## ✅ Script 2: Fix Astrologer Minutes (0 → 1)

**File**: `server/scripts/fixAstrologerMinutes.js`

**What it does**:
- Finds all astrologers with 0 call logs
- Creates a sample 1-minute completed call
- Sets earnings to ₹1 (1 minute × ₹1/min)

**Run**: `cd server && node scripts/fixAstrologerMinutes.js`

---

## How to Use

### Add ₹100 to all clients:
```bash
cd /Users/wohozo/astroweb/server
node scripts/addBalanceToClients.js
```

### Fix astrologer minutes:
```bash
cd /Users/wohozo/astroweb/server
node scripts/fixAstrologerMinutes.js
```

---

## ⚠️ Important Notes

1. **Idempotent**: Scripts check before adding (won't duplicate)
2. **Safe**: Only adds data, doesn't delete anything
3. **Logged**: Shows exactly what was changed
4. **Reversible**: Can manually adjust in Admin Dashboard if needed

---

*Scripts created and tested! ₹100 added to 4 clients successfully.* ✅
