const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

exports.generateToken = (req, res) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channel = req.query.channel;
  const uidParam = req.query.uid || 0;
  const uid = Number(uidParam) || 0;
  if (!appID || !appCertificate) {
    return res
      .status(500)
      .json({ error: "Agora App ID or Certificate not configured on server" });
  }
  if (!channel) {
    return res.status(400).json({ error: "channel is required" });
  }

  try {
    const expirationTimeInSeconds = 24 * 3600; // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expirationTimeInSeconds;

    const role = RtcRole.PUBLISHER; // allow publishing for callers
    let token;
    // If uid param cannot be represented as a number (e.g. Mongo ObjectId), use account-based token
    if (Number.isNaN(Number(uidParam))) {
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        appID,
        appCertificate,
        channel,
        String(uidParam),
        role,
        privilegeExpireTs
      );
    } else {
      token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channel,
        uid,
        role,
        privilegeExpireTs
      );
    }
    return res.json({ token });
  } catch (err) {
    console.error("Agora token generation error:", err);
    return res.status(500).json({ error: err.message });
  }
};
