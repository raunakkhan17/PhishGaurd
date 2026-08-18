// ============================================================
// PhishGuard Seed Script
// Run: node seed.js
// ============================================================

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threat-website';

// ── Schemas (inline to avoid import issues) ─────────────────

const userSchema = new mongoose.Schema({ name: String, email: String, password: String, role: String }, { timestamps: true });

const forumSchema = new mongoose.Schema({
  title: String, content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String, tags: [String], likes: [], views: { type: Number, default: 0 },
  comments: [{ user: mongoose.Schema.Types.ObjectId, text: String, name: String, date: { type: Date, default: Date.now } }],
  isActive: { type: Boolean, default: true }, isPinned: { type: Boolean, default: false }
}, { timestamps: true });

const educationSchema = new mongoose.Schema({
  title: String, description: String, content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String, topics: [String], resourceType: String,
  fileUrl: { type: String, default: '' }, views: { type: Number, default: 0 },
  ratings: [], averageRating: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

const flaggedSchema = new mongoose.Schema({
  url: String, title: String, description: String,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String, severity: String, screenshot: { type: String, default: '' },
  evidence: String, status: { type: String, default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String, default: '' }, dateReviewed: Date,
  reports: [], isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Forum = mongoose.model('Forum', forumSchema);
const EducationResource = mongoose.model('EducationResource', educationSchema);
const FlaggedWebsite = mongoose.model('FlaggedWebsite', flaggedSchema);

// ── Main Seed Function ───────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  const bcrypt = require('bcryptjs');
  
  let user = await User.findOne({ role: 'user' });
  let admin = await User.findOne({ role: 'admin' });

  if (!user) {
    const hashedUserPass = await bcrypt.hash('user123', 10);
    user = await User.create({
      name: 'Test User',
      email: 'user@phishguard.com',
      password: hashedUserPass,
      role: 'user'
    });
    console.log('👤 Created default user: user@phishguard.com');
  }

  if (!admin) {
    const hashedAdminPass = await bcrypt.hash('admin123', 10);
    admin = await User.create({
      name: 'Admin Rahul',
      email: 'admin@phishguard.com',
      password: hashedAdminPass,
      role: 'admin'
    });
    console.log('🔑 Created default admin: admin@phishguard.com');
  }

  console.log('👤 User :', user.email);
  console.log('🔑 Admin:', admin.email);

  // ── Clear existing seed data ────────────────────────────────
  await Forum.deleteMany({});
  await EducationResource.deleteMany({});
  await FlaggedWebsite.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // ================================================================
  // FORUMS
  // ================================================================
  const forums = await Forum.insertMany([
    {
      title: 'I received a fake PayPal email asking to verify my account — phishing?',
      content: `Got an email claiming to be from PayPal saying my account was limited and I needed to verify my identity within 24 hours. The email looked very convincing — had PayPal's logo, proper formatting, and a "Verify Now" button.\n\nWhen I hovered over the link, the URL was something like paypa1-secure-verify.com instead of paypal.com. Classic phishing.\n\nAlways hover over links before clicking. Legitimate companies never use random third-party domains. I reported it to PayPal's phishing team at spoof@paypal.com.`,
      author: user._id,
      category: 'phishing',
      tags: ['paypal', 'email-phishing', 'spoofing', 'fake-login'],
      views: 342,
      isPinned: true,
      comments: [
        { user: admin._id, text: 'Great catch! The "1" instead of "l" in paypa1 is a classic typosquatting trick. Always check the actual domain.', name: 'Admin Rahul', date: new Date('2024-11-10') },
        { user: user._id, text: 'I got the same email last week! Glad I checked before clicking.', name: 'Test User', date: new Date('2024-11-11') }
      ]
    },
    {
      title: 'Warning: Fake SBI banking SMS asking to update KYC',
      content: `Multiple users have reported receiving SMS messages claiming to be from SBI (State Bank of India) stating that their account will be blocked unless KYC is updated.\n\nThe SMS contains a link to sbi-kyc-update.net — this is NOT the official SBI website. The official domain is onlinesbi.sbi.\n\nNever click links in SMS. Open your bank's official app or type the URL manually. SMS phishing (smishing) is on the rise in India targeting bank customers.`,
      author: user._id,
      category: 'phishing',
      tags: ['sbi', 'smishing', 'kyc-fraud', 'banking', 'india'],
      views: 891,
      isPinned: true,
      comments: [
        { user: admin._id, text: 'Pinning this — very relevant for Indian users. RBI has also issued advisories about this.', name: 'Admin Rahul', date: new Date('2024-11-15') }
      ]
    },
    {
      title: 'How does ransomware spread through phishing emails?',
      content: `Ransomware is one of the most damaging cyber attacks. It typically spreads through:\n\n1. Malicious email attachments (.docx, .pdf, .zip) containing macros\n2. Links to fake websites that download malware silently\n3. Exploit kits targeting outdated browsers\n\nOnce executed, it encrypts your files and demands payment in cryptocurrency. The WannaCry attack in 2017 infected 230,000+ systems in 150 countries.\n\nBest protection: regular backups, updated OS, email filtering, and never enabling macros from unknown documents.`,
      author: admin._id,
      category: 'ransomware',
      tags: ['ransomware', 'wannacry', 'email-attachment', 'malware', 'encryption'],
      views: 523,
      comments: [
        { user: user._id, text: 'Very informative! I had no idea macros could be this dangerous.', name: 'Test User', date: new Date('2024-11-20') }
      ]
    },
    {
      title: 'Data breach at a popular food delivery app — what should I do?',
      content: `A major food delivery platform recently suffered a data breach exposing names, phone numbers, emails, and partial payment info of millions of users.\n\nImmediate steps if you are affected:\n1. Change your password immediately\n2. Enable two-factor authentication\n3. Monitor your bank statements\n4. Check haveibeenpwned.com to see if your email was exposed\n5. Be extra cautious of phishing emails that reference your account\n\nCompanies are required to notify affected users under data protection laws, but don't wait — act proactively.`,
      author: user._id,
      category: 'data-breach',
      tags: ['data-breach', 'password', '2fa', 'personal-data', 'privacy'],
      views: 412,
      comments: []
    },
    {
      title: 'Social engineering attack — someone called pretending to be IT support',
      content: `Someone called me claiming to be from our company's IT department saying they detected unusual activity on my computer and needed remote access to fix it.\n\nThey asked me to install AnyDesk and share the access code. This is a classic vishing (voice phishing) attack.\n\nLegitimate IT departments never cold-call you asking for remote access. Always verify by calling back on the official company number. I hung up and reported to our actual IT team.`,
      author: user._id,
      category: 'social-engineering',
      tags: ['vishing', 'it-support-scam', 'remote-access', 'anydesk', 'social-engineering'],
      views: 267,
      comments: [
        { user: admin._id, text: 'This is extremely common. Companies should train employees to verify IT support calls.', name: 'Admin Rahul', date: new Date('2024-12-01') }
      ]
    },
    {
      title: 'Malware found in a cracked software download — stay safe',
      content: `Downloaded what I thought was a cracked version of a popular design tool from a torrent site. My antivirus flagged it 2 days later as a keylogger that had been silently recording my keystrokes.\n\nI had to:\n1. Wipe and reinstall Windows\n2. Change all passwords from a different device\n3. Check for unauthorized access on all accounts\n\nNever download cracked or pirated software. The risk is not worth it — there are free alternatives for almost every paid tool (GIMP, LibreOffice, VS Code, etc.).`,
      author: user._id,
      category: 'malware',
      tags: ['keylogger', 'cracked-software', 'torrent', 'malware', 'piracy'],
      views: 198,
      comments: []
    },
    {
      title: 'How to identify a phishing website — 7 red flags to watch for',
      content: `After studying hundreds of phishing sites, here are the most common red flags:\n\n1. **URL mismatch** — paypa1.com instead of paypal.com\n2. **No HTTPS** — legitimate banks always use HTTPS\n3. **Urgency language** — "Your account will be closed in 24 hours!"\n4. **Poor grammar** — many phishing pages have spelling errors\n5. **Requests for unusual info** — asking for your full card number + CVV + OTP together\n6. **Generic greeting** — "Dear Customer" instead of your name\n7. **Suspicious domain extensions** — .tk, .ml, .ga domains are often free and used by attackers\n\nPhishGuard can automatically detect most of these patterns for you!`,
      author: admin._id,
      category: 'phishing',
      tags: ['red-flags', 'url-check', 'https', 'awareness', 'tips'],
      views: 756,
      isPinned: false,
      comments: [
        { user: user._id, text: 'This should be shared with everyone. Bookmarking this post!', name: 'Test User', date: new Date('2024-12-05') }
      ]
    },
    {
      title: 'Network security basics — how to secure your home WiFi',
      content: `Most people never change their router's default settings, making them easy targets. Here is how to properly secure your home network:\n\n1. Change default router admin password\n2. Use WPA3 encryption (or WPA2 if WPA3 not available)\n3. Hide your SSID (network name)\n4. Enable router firewall\n5. Disable WPS — it has known vulnerabilities\n6. Regularly check connected devices list\n7. Keep router firmware updated\n8. Use a guest network for IoT devices\n\nA compromised router can intercept all your traffic, including banking sessions.`,
      author: admin._id,
      category: 'network-security',
      tags: ['wifi', 'router', 'wpa3', 'home-network', 'firewall'],
      views: 334,
      comments: []
    }
  ]);

  console.log(`✅ Forums seeded: ${forums.length} posts`);

  // ================================================================
  // EDUCATION RESOURCES
  // ================================================================
  const resources = await EducationResource.insertMany([
    {
      title: 'Phishing 101: How to Spot and Avoid Phishing Attacks',
      description: 'A beginner-friendly guide covering the basics of phishing — what it is, how attackers craft convincing emails, and practical steps to protect yourself.',
      content: `## What is Phishing?\nPhishing is a type of cyber attack where criminals impersonate trusted organizations to steal sensitive information like passwords and credit card numbers.\n\n## How Phishing Emails Work\nAttackers send emails that appear to come from banks, government agencies, or popular services. These emails create urgency ("Your account will be suspended!") and contain links to fake websites.\n\n## How to Spot a Phishing Email\n- Check the sender's actual email address (not just the display name)\n- Hover over links before clicking to see the real URL\n- Look for grammatical errors and generic greetings\n- Be suspicious of unexpected attachments\n- Verify by contacting the organization directly\n\n## What to Do If You Clicked a Phishing Link\n1. Disconnect from the internet immediately\n2. Change your passwords from a different device\n3. Enable two-factor authentication\n4. Contact your bank if financial info was shared\n5. Report the phishing attempt to authorities`,
      author: admin._id,
      category: 'beginner',
      topics: ['phishing', 'email-security', 'awareness', 'social-engineering'],
      resourceType: 'guide',
      views: 1240,
      averageRating: 4.7,
      ratings: [
        { user: user._id, value: 5, comment: 'Very clear and easy to understand!', date: new Date('2024-11-01') }
      ]
    },
    {
      title: 'Understanding URL Manipulation and Typosquatting',
      description: 'An intermediate guide explaining how attackers craft malicious URLs that look legitimate, and how to analyze URLs before clicking.',
      content: `## What is URL Manipulation?\nAttackers create URLs that closely resemble legitimate ones to trick users into visiting fake websites.\n\n## Common Techniques\n\n### Typosquatting\nRegistering domains with common typos: gooogle.com, paypa1.com, arnazon.com\n\n### Subdomain Tricks\npaypal.com.secure-login.net — paypal.com is a subdomain here, not the main domain!\n\n### Unicode Homoglyphs\nUsing characters from other alphabets that look identical: аpple.com (using Cyrillic 'а')\n\n### URL Shorteners\nbit.ly links hide the real destination — always expand shortened URLs before clicking\n\n## How to Analyze a URL\n1. Look at the domain name carefully (the part before the first single slash)\n2. Check for HTTPS and a valid certificate\n3. Use tools like PhishGuard to scan URLs automatically\n4. Expand shortened URLs using unshorten.it\n\n## Tools for URL Analysis\n- VirusTotal: scan URLs for malware\n- PhishGuard: ML-based phishing detection\n- URLScan.io: screenshot and analyze any URL`,
      author: admin._id,
      category: 'intermediate',
      topics: ['url-analysis', 'typosquatting', 'domain-spoofing', 'phishing'],
      resourceType: 'article',
      views: 876,
      averageRating: 4.5,
      ratings: []
    },
    {
      title: 'Complete Guide to Two-Factor Authentication (2FA)',
      description: 'Learn why passwords alone are not enough and how to properly set up and use two-factor authentication across all your accounts.',
      content: `## Why Passwords Alone Are Not Enough\nEven strong passwords can be stolen through phishing, data breaches, or keyloggers. 2FA adds a second layer of protection.\n\n## Types of 2FA\n\n### SMS OTP (Least Secure)\nOne-time passwords sent via SMS. Vulnerable to SIM swapping attacks.\n\n### Authenticator Apps (Recommended)\nApps like Google Authenticator, Authy, or Microsoft Authenticator generate time-based codes locally. Not sent over the network.\n\n### Hardware Keys (Most Secure)\nPhysical devices like YubiKey. Nearly impossible to phish.\n\n### Biometrics\nFingerprint or face recognition. Convenient but platform-dependent.\n\n## How to Set Up 2FA\n1. Go to your account's security settings\n2. Look for "Two-Factor Authentication" or "Two-Step Verification"\n3. Choose Authenticator App option\n4. Scan the QR code with your authenticator app\n5. Save the backup codes in a secure place\n\n## Accounts That Must Have 2FA\n- Email (most important — controls password resets)\n- Banking and financial accounts\n- Social media\n- Cloud storage`,
      author: admin._id,
      category: 'beginner',
      topics: ['2fa', 'authentication', 'account-security', 'password'],
      resourceType: 'tutorial',
      views: 2103,
      averageRating: 4.9,
      ratings: [
        { user: user._id, value: 5, comment: 'Set up 2FA on all my accounts after reading this!', date: new Date('2024-11-20') }
      ]
    },
    {
      title: 'How Ransomware Works: A Technical Deep Dive',
      description: 'Advanced technical analysis of ransomware attack chains — from initial delivery through encryption to recovery strategies.',
      content: `## Ransomware Attack Chain\n\n### Stage 1: Initial Access\nMost ransomware enters through:\n- Phishing emails with malicious attachments\n- Remote Desktop Protocol (RDP) brute force\n- Exploiting unpatched vulnerabilities\n\n### Stage 2: Execution\nOnce on the system, the ransomware:\n1. Disables Windows Defender and backup services\n2. Deletes shadow copies (VSS) to prevent recovery\n3. Establishes persistence via registry keys\n\n### Stage 3: Lateral Movement\nAdvanced ransomware spreads across the network using:\n- Pass-the-hash attacks\n- Credential dumping (Mimikatz)\n- Exploiting network shares\n\n### Stage 4: Encryption\nFiles are encrypted using hybrid encryption:\n- Symmetric AES-256 for speed\n- Asymmetric RSA-2048 to protect the AES key\n\n### Stage 5: Extortion\nRansom note dropped with payment instructions in cryptocurrency.\n\n## Defense Strategies\n1. Immutable offsite backups (3-2-1 rule)\n2. Network segmentation\n3. Endpoint Detection and Response (EDR)\n4. Principle of least privilege\n5. Regular patch management`,
      author: admin._id,
      category: 'advanced',
      topics: ['ransomware', 'encryption', 'incident-response', 'malware-analysis'],
      resourceType: 'article',
      views: 654,
      averageRating: 4.6,
      ratings: []
    },
    {
      title: 'Social Engineering: The Human Side of Cyber Attacks',
      description: 'Understanding psychological manipulation tactics used by attackers and how to build a human firewall in your organization.',
      content: `## What is Social Engineering?\nSocial engineering exploits human psychology rather than technical vulnerabilities. It is often easier to trick a person than to hack a system.\n\n## Common Psychological Triggers Used\n\n### Authority\n"This is your bank's fraud department. We need to verify your card immediately."\n\n### Urgency/Fear\n"Your account will be permanently deleted in 2 hours unless you act now!"\n\n### Reciprocity\n"I helped you with that project, can you share your login for a second?"\n\n### Social Proof\n"Everyone in the team has already submitted their credentials to the new portal."\n\n## Attack Types\n- **Phishing**: Email-based deception\n- **Vishing**: Voice/phone-based attacks\n- **Smishing**: SMS-based attacks\n- **Pretexting**: Creating a fabricated scenario\n- **Baiting**: Leaving infected USB drives in parking lots\n\n## Building a Human Firewall\n1. Regular security awareness training\n2. Simulated phishing campaigns\n3. Clear escalation procedures for suspicious requests\n4. Culture of "verify before you trust"\n5. No-blame reporting policy`,
      author: admin._id,
      category: 'intermediate',
      topics: ['social-engineering', 'phishing', 'vishing', 'awareness-training'],
      resourceType: 'guide',
      views: 989,
      averageRating: 4.8,
      ratings: [
        { user: user._id, value: 5, comment: 'The psychological triggers section was eye-opening.', date: new Date('2024-12-01') }
      ]
    },
    {
      title: 'Beginner\'s Guide to Safe Browsing and Password Management',
      description: 'Essential habits every internet user should have — safe browsing practices, password hygiene, and using a password manager.',
      content: `## Safe Browsing Habits\n\n### Always Check for HTTPS\nLook for the padlock icon in your browser's address bar. HTTP sites transmit data in plain text.\n\n### Verify URLs Before Clicking\nDon't click shortened links without expanding them first. Hover to see the real destination.\n\n### Keep Browser Updated\nBrowser updates patch security vulnerabilities. Enable automatic updates.\n\n### Use Browser Extensions Wisely\nOnly install extensions from trusted publishers. Malicious extensions can steal your data.\n\n## Password Best Practices\n\n### What Makes a Strong Password\n- At least 12 characters\n- Mix of uppercase, lowercase, numbers, symbols\n- No dictionary words or personal info\n- Unique for every account\n\n### Use a Password Manager\nTools like Bitwarden (free, open source) or 1Password securely store and auto-fill passwords.\n\n**Never** reuse passwords. If one site is breached, all your accounts with that password become vulnerable.\n\n### Check for Breaches\nVisit haveibeenpwned.com to check if your email has appeared in any known data breaches.`,
      author: user._id,
      category: 'beginner',
      topics: ['safe-browsing', 'password-manager', 'https', 'privacy', 'bitwarden'],
      resourceType: 'guide',
      views: 1567,
      averageRating: 4.6,
      ratings: []
    }
  ]);

  console.log(`✅ Education resources seeded: ${resources.length} resources`);

  // ================================================================
  // FLAGGED WEBSITES (Reports + Public Directory)
  // ================================================================
  const websites = await FlaggedWebsite.insertMany([
    // ── APPROVED (visible in Public Directory) ──────────────────
    {
      url: 'http://paypa1-secure-login.com',
      title: 'Fake PayPal Login Page',
      description: 'This website mimics the official PayPal login page. It uses "paypa1" with the number 1 instead of the letter l. Designed to steal PayPal credentials.',
      submittedBy: user._id,
      category: 'phishing',
      severity: 'critical',
      evidence: 'The page is an exact copy of paypal.com/signin. The URL uses paypa1 (with digit 1). SSL certificate issued to unknown entity. Form submits credentials to attacker-controlled server.',
      status: 'approved',
      reviewedBy: admin._id,
      reviewNotes: 'Verified phishing site. URL confirmed to be a typosquatting variant. Approved for public directory.',
      dateReviewed: new Date('2024-11-05'),
      isActive: true
    },
    {
      url: 'http://sbi-kyc-update.net',
      title: 'Fake SBI KYC Update Portal',
      description: 'Impersonates State Bank of India. Sends SMS to users claiming their account will be blocked and asks them to update KYC through this fake portal.',
      submittedBy: user._id,
      category: 'bank-phishing',
      severity: 'critical',
      evidence: 'Domain registered 3 days ago. Page clones SBI\'s official website. Collects account number, ATM PIN, and OTP. SMS campaign targeting Indian mobile numbers.',
      status: 'approved',
      reviewedBy: admin._id,
      reviewNotes: 'Confirmed smishing campaign. Multiple reports from users. Added to directory.',
      dateReviewed: new Date('2024-11-10'),
      isActive: true
    },
    {
      url: 'http://amazon-prize-winner2024.com',
      title: 'Fake Amazon Prize Winner Scam',
      description: 'Users receive emails saying they won an Amazon prize. The link leads to this site which collects personal information and credit card details under the pretext of "shipping charges".',
      submittedBy: user._id,
      category: 'scam',
      severity: 'high',
      evidence: 'Email campaign in circulation. Site asks for credit card to pay ₹99 shipping. Free .com domain registered anonymously. No connection to Amazon.',
      status: 'approved',
      reviewedBy: admin._id,
      reviewNotes: 'Classic advance-fee scam. Approved.',
      dateReviewed: new Date('2024-11-15'),
      isActive: true
    },
    {
      url: 'http://netflix-free-subscription.tk',
      title: 'Fake Netflix Free Subscription Site',
      description: 'Offers free Netflix subscription for completing a survey. Collects credit card information claiming it is needed for "identity verification".',
      submittedBy: user._id,
      category: 'streaming-phishing',
      severity: 'high',
      evidence: 'Free .tk domain. Page clones Netflix branding. Survey collects name, email, phone. Final step requests full card details. Certificate issued same day as report.',
      status: 'approved',
      reviewedBy: admin._id,
      reviewNotes: 'Streaming phishing — confirmed. Approved for directory.',
      dateReviewed: new Date('2024-11-20'),
      isActive: true
    },
    {
      url: 'http://crypto-doubler-invest.com',
      title: 'Crypto Doubling Investment Scam',
      description: 'Promises to double any cryptocurrency investment within 24 hours. Impersonates Elon Musk and Tesla branding. Classic advance-payment crypto scam.',
      submittedBy: user._id,
      category: 'crypto-scam',
      severity: 'critical',
      evidence: 'Uses fake Elon Musk endorsement. Site shows fake "live" transaction feed. Wallet addresses collected money and disappeared. Domain hidden behind privacy protection.',
      status: 'approved',
      reviewedBy: admin._id,
      reviewNotes: 'Well-known crypto scam template. Approved.',
      dateReviewed: new Date('2024-11-25'),
      isActive: true
    },
    {
      url: 'http://hdfc-netbanking-secure.xyz',
      title: 'Fake HDFC Bank Net Banking Portal',
      description: 'Exact clone of HDFC Bank\'s net banking portal. Distributed via phishing SMS claiming unusual login activity detected.',
      submittedBy: user._id,
      category: 'bank-phishing',
      severity: 'critical',
      evidence: 'Page source code is copied from HDFC official site. Credentials submitted to foreign IP. .xyz domain registered through anonymous registrar.',
      status: 'approved',
      reviewedBy: admin._id,
      reviewNotes: 'Bank phishing confirmed. High priority — approved.',
      dateReviewed: new Date('2024-12-01'),
      isActive: true
    },
    {
      url: 'http://fake-shop-branded-shoes.com',
      title: 'Fake Branded Shoes Online Store',
      description: 'Sells fake Nike, Adidas, and Puma shoes at 90% discount. Takes payment but never delivers. Uses stolen product images from legitimate retailers.',
      submittedBy: user._id,
      category: 'fake-shop',
      severity: 'medium',
      evidence: 'Multiple consumer complaints. No physical address listed. Contact email is a free Gmail account. Payment only via UPI with no refund policy.',
      status: 'approved',
      reviewedBy: admin._id,
      reviewNotes: 'Fake e-commerce site confirmed. Approved.',
      dateReviewed: new Date('2024-12-05'),
      isActive: true
    },

    // ── PENDING (visible in Admin Dashboard) ───────────────────
    {
      url: 'http://whatsapp-gold-download.com',
      title: 'Fake WhatsApp Gold Download',
      description: 'Claims to offer a premium version of WhatsApp called "WhatsApp Gold" with exclusive features. Actually installs spyware on the victim\'s device.',
      submittedBy: user._id,
      category: 'malware',
      severity: 'high',
      evidence: 'APK file contains known spyware signature. App requests excessive permissions including call logs, contacts, and microphone. Domain linked to previous malware campaigns.',
      status: 'pending',
      isActive: true
    },
    {
      url: 'http://free-recharge-trick2024.in',
      title: 'Fake Free Mobile Recharge Site',
      description: 'Claims to offer free mobile recharge by completing tasks. Harvests phone numbers and personal data. Links shared widely on WhatsApp groups.',
      submittedBy: user._id,
      category: 'scam',
      severity: 'medium',
      evidence: 'Site collects phone number and carrier info. Shares collected data with third-party advertisers. Never delivers promised recharge. Viral WhatsApp spread.',
      status: 'pending',
      isActive: true
    },
    {
      url: 'http://income-tax-refund-gov.net',
      title: 'Fake Income Tax Refund Portal',
      description: 'Impersonates the Indian Income Tax department. Informs users of a pending refund and asks them to submit their PAN card, Aadhaar, and bank account details to claim it.',
      submittedBy: user._id,
      category: 'phishing',
      severity: 'critical',
      evidence: 'Uses Government of India logos and color scheme. Collects PAN, Aadhaar, and bank account details. .net TLD — actual government site uses .gov.in.',
      status: 'pending',
      isActive: true
    },
    {
      url: 'http://ransomware-decryptor-tool.com',
      title: 'Fake Ransomware Decryptor Tool',
      description: 'Targets ransomware victims by offering a free decryption tool. The tool is itself malware that installs a second-stage ransomware payload.',
      submittedBy: user._id,
      category: 'ransomware',
      severity: 'critical',
      evidence: 'Executable flagged by 34/68 VirusTotal engines. Double-extension filename: decryptor.pdf.exe. C2 communication detected to known botnet infrastructure.',
      status: 'pending',
      isActive: true
    },

    // ── REJECTED ───────────────────────────────────────────────
    {
      url: 'http://example-test-site.com',
      title: 'Test Submission',
      description: 'This was a test submission to check how the reporting system works.',
      submittedBy: user._id,
      category: 'other',
      severity: 'low',
      evidence: 'No evidence provided. This appears to be a test.',
      status: 'rejected',
      reviewedBy: admin._id,
      reviewNotes: 'Rejected — test submission with no legitimate threat evidence.',
      dateReviewed: new Date('2024-12-01'),
      isActive: false
    }
  ]);

  const approved = websites.filter(w => w.status === 'approved').length;
  const pending  = websites.filter(w => w.status === 'pending').length;
  const rejected = websites.filter(w => w.status === 'rejected').length;
  console.log(`✅ Flagged websites seeded: ${websites.length} total (${approved} approved, ${pending} pending, ${rejected} rejected)`);

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────');
  console.log(`📝 Forums          : ${forums.length} posts`);
  console.log(`📚 Education       : ${resources.length} resources`);
  console.log(`🚨 Reports/Dir     : ${websites.length} entries`);
  console.log(`   ├── Approved    : ${approved} (visible in Public Directory)`);
  console.log(`   ├── Pending     : ${pending} (visible in Admin Dashboard)`);
  console.log(`   └── Rejected    : ${rejected}`);
  console.log('─────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
