const FlaggedWebsite = require('../models/directory.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const fetch = require('node-fetch');

/**
 * @desc    Submit a new flagged website
 * @route   POST /api/directory
 * @access  Private
 */
exports.submitWebsite = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { url, title, description, category, severity, screenshot, evidence } = req.body;

    // Create new flagged website entry
    const flaggedWebsite = await FlaggedWebsite.create({
      url,
      title,
      description,
      category,
      severity,
      screenshot,
      evidence,
      submittedBy: req.user.id,
      status: 'pending',
    });

    // Return created website with user details
    const populatedWebsite = await FlaggedWebsite.findById(flaggedWebsite._id)
      .populate('submittedBy', 'name');

    res.status(201).json(populatedWebsite);
  } catch (error) {
    console.error('Submit website error:', error);
    res.status(500).json({ message: 'Server error submitting flagged website' });
  }
};

/**
 * @desc    Get all flagged websites with filters and pagination
 * @route   GET /api/directory
 * @access  Public
 */
exports.getFlaggedWebsites = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      severity,
      status = 'approved', // Default to only approved entries for public view
      sort = 'latest',
      search,
    } = req.query;

    // Build query
    let query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Filter by severity if provided
    if (severity) {
      query.severity = severity;
    }

    // Filter by status - default to approved for public view
    if (req.user && req.user.role === 'admin') {
      // Admins can see all entries or filter by status
      if (status) {
        query.status = status;
      }
    } else {
      // Non-admins can only see approved entries
      query.status = 'approved';
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Set up sorting
    let sortOption = {};
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highSeverity':
        // Sort severity from critical to low
        sortOption = { 
          severity: -1, // -1 will sort in reverse, so "critical" comes first
          createdAt: -1 
        };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const websites = await FlaggedWebsite.find(query)
      .populate('submittedBy', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination info
    const total = await FlaggedWebsite.countDocuments(query);

    res.json({
      websites,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
      },
    });
  } catch (error) {
    console.error('Get flagged websites error:', error);
    res.status(500).json({ message: 'Server error fetching flagged websites' });
  }
};

/**
 * @desc    Get flagged website by ID
 * @route   GET /api/directory/:id
 * @access  Public/Private (details depend on status)
 */
exports.getFlaggedWebsiteById = async (req, res) => {
  try {
    const website = await FlaggedWebsite.findById(req.params.id)
      .populate('submittedBy', 'name')
      .populate('reviewedBy', 'name');
    
    if (!website) {
      return res.status(404).json({ message: 'Flagged website not found' });
    }

    // Restrict access to non-approved entries
    if (website.status !== 'approved' && 
        (!req.user || (req.user.role !== 'admin' && website.submittedBy._id.toString() !== req.user.id))) {
      return res.status(403).json({ message: 'Access denied to this entry' });
    }

    res.json(website);
  } catch (error) {
    console.error('Get flagged website error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Flagged website not found' });
    }
    
    res.status(500).json({ message: 'Server error fetching flagged website' });
  }
};

/**
 * @desc    Update flagged website (for submitter)
 * @route   PUT /api/directory/:id
 * @access  Private
 */
exports.updateFlaggedWebsite = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { url, title, description, category, severity, screenshot, evidence } = req.body;
    
    // Find website entry
    let website = await FlaggedWebsite.findById(req.params.id);
    
    if (!website) {
      return res.status(404).json({ message: 'Flagged website not found' });
    }

    // Check if user is submitter or admin
    if (website.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this entry' });
    }

    // Check if entry can be updated (only pending entries can be updated by submitter)
    if (website.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot update entry after review' });
    }

    // Update fields
    website.url = url || website.url;
    website.title = title || website.title;
    website.description = description || website.description;
    website.category = category || website.category;
    website.severity = severity || website.severity;
    website.screenshot = screenshot !== undefined ? screenshot : website.screenshot;
    website.evidence = evidence || website.evidence;

    // Reset to pending if a reviewed entry is updated by admin
    if (website.status !== 'pending' && req.user.role === 'admin') {
      website.status = 'pending';
    }

    // Save updated entry
    await website.save();
    
    // Return updated entry with populated fields
    website = await FlaggedWebsite.findById(req.params.id)
      .populate('submittedBy', 'name')
      .populate('reviewedBy', 'name');

    res.json(website);
  } catch (error) {
    console.error('Update flagged website error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Flagged website not found' });
    }
    
    res.status(500).json({ message: 'Server error updating flagged website' });
  }
};

/**
 * @desc    Delete flagged website
 * @route   DELETE /api/directory/:id
 * @access  Private
 */
exports.deleteFlaggedWebsite = async (req, res) => {
  try {
    const website = await FlaggedWebsite.findById(req.params.id);
    
    if (!website) {
      return res.status(404).json({ message: 'Flagged website not found' });
    }

    // Check if user is submitter or admin
    if (website.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this entry' });
    }

    await website.deleteOne();

    res.json({ message: 'Flagged website removed' });
  } catch (error) {
    console.error('Delete flagged website error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Flagged website not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting flagged website' });
  }
};

/**
 * @desc    Add report to a flagged website
 * @route   POST /api/directory/:id/report
 * @access  Private
 */
exports.addReport = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { comment } = req.body;
    
    // Find website entry
    const website = await FlaggedWebsite.findById(req.params.id);
    
    if (!website) {
      return res.status(404).json({ message: 'Flagged website not found' });
    }

    // Only approved entries can be reported
    if (website.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved entries can be reported' });
    }

    // Create new report
    const newReport = {
      user: req.user.id,
      comment,
    };

    // Add report to website entry
    website.reports.unshift(newReport);
    await website.save();

    res.json(website.reports);
  } catch (error) {
    console.error('Add report error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Flagged website not found' });
    }
    
    res.status(500).json({ message: 'Server error adding report' });
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/directory/categories
 * @access  Public
 */
exports.getCategories = async (req, res) => {
  try {
    // Get unique categories
    const categories = await FlaggedWebsite.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

/**
 * @desc    Get severity levels
 * @route   GET /api/directory/severity-levels
 * @access  Public
 */
exports.getSeverityLevels = async (req, res) => {
  try {
    // Return predefined severity levels
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    res.json(severityLevels);
  } catch (error) {
    console.error('Get severity levels error:', error);
    res.status(500).json({ message: 'Server error fetching severity levels' });
  }
};

// Cache for storing URL scan results to improve performance
const urlCache = new Map();
// Cache TTL in milliseconds (15 minutes)
const CACHE_TTL = 15 * 60 * 1000;

/**
 * @desc    Check if URL is potentially phishing
 * @route   POST /api/directory/check-url
 * @access  Public
 */
exports.checkUrl = async (req, res) => {
  try {
    // Get URL from request
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }
    
    // Normalize URL for consistency
    const normalizedUrl = normalizeUrl(url);
    const domain = extractDomain(normalizedUrl);
    const fullUrl = normalizedUrl; // Keep the full URL for path analysis
    
    // Check cache first
    const cacheKey = fullUrl.toLowerCase(); // Use full URL as cache key for better precision
    if (urlCache.has(cacheKey)) {
      const cachedResult = urlCache.get(cacheKey);
      if (cachedResult.timestamp > Date.now() - CACHE_TTL) {
        console.log('Cache hit for URL:', cacheKey);
        return res.json(cachedResult.data);
      } else {
        // Cache expired, remove it
        urlCache.delete(cacheKey);
      }
    }
    
    // Use Promise.allSettled to run all checks in parallel
    const [whoisResult, reputationResult, intelligenceResult] = await Promise.allSettled([
      getWhoisData(domain),
      getDomainReputation(domain),
      getThreatIntelligence(domain)
    ]);
    
    // Extract data from results, handling any failed promises
    const whoisData = whoisResult.status === 'fulfilled' ? whoisResult.value : null;
    const reputationData = reputationResult.status === 'fulfilled' ? reputationResult.value : null;
    const intelligenceData = intelligenceResult.status === 'fulfilled' ? intelligenceResult.value : null;
    
    // Calculate overall score and verdict
    const result = calculatePhishingScore(domain, fullUrl, whoisData, reputationData, intelligenceData);
    
    // Store in cache
    urlCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });
    
    res.json(result);
  } catch (error) {
    console.error('URL check error:', error);
    res.status(500).json({ message: 'Error checking URL', error: error.message });
  }
};

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    // Handle URLs without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch (error) {
    // Return as is if URL parsing fails
    return url.toLowerCase();
  }
}

/**
 * Normalize URL for consistent handling
 */
function normalizeUrl(url) {
  // Handle URLs without protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }
  return url.toLowerCase().trim();
}

/**
 * Get WHOIS data for domain
 */
async function getWhoisData(domain) {
  try {
    const WHOIS_API_KEY = process.env.WHOIS_API_KEY;
    const whoisUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`;
    
    const response = await fetch(whoisUrl);
    if (!response.ok) throw new Error(`WHOIS API error: ${response.status}`);
    
    const whoisData = await response.json();
    const record = whoisData?.WhoisRecord || {};
    
    return {
      domainName: record.domainName,
      createdDate: record.createdDate,
      updatedDate: record.updatedDate,
      expiresDate: record.expiresDate,
      registrar: record.registrarName,
      registrantOrg: record.registrant?.organization,
      registrantCountry: record.registrant?.country,
      nameServers: record.nameServers?.hostNames,
      status: record.status,
      estimatedDomainAge: record.estimatedDomainAge,
    };
  } catch (error) {
    console.error('WHOIS data error:', error);
    return null;
  }
}

/**
 * Get domain reputation score
 */
async function getDomainReputation(domain) {
  try {
    const API_KEY = process.env.WHOIS_API_KEY;
    const reputationUrl = `https://domain-reputation.whoisxmlapi.com/api/v2?apiKey=${API_KEY}&domainName=${domain}`;
    
    const response = await fetch(reputationUrl);
    if (!response.ok) throw new Error(`Domain reputation API error: ${response.status}`);
    
    return await response.json();
  } catch (error) {
    console.error('Domain reputation error:', error);
    return null;
  }
}

/**
 * Get threat intelligence data
 */
async function getThreatIntelligence(domain) {
  try {
    const API_KEY = process.env.WHOIS_API_KEY;
    const intelligenceUrl = `https://threat-intelligence.whoisxmlapi.com/api/v1?apiKey=${API_KEY}&ioc=${domain}&outputFormat=JSON`;
    
    const response = await fetch(intelligenceUrl);
    if (!response.ok) throw new Error(`Threat intelligence API error: ${response.status}`);
    
    return await response.json();
  } catch (error) {
    console.error('Threat intelligence error:', error);
    return null;
  }
}

/**
 * Calculate phishing score based on multiple criteria
 */
function calculatePhishingScore(domain, fullUrl, whoisData, reputationData, intelligenceData) {
  // Initialize scoring components
  const scores = {
    domain: { score: 0, maxScore: 20, reasons: [] },
    urlPath: { score: 0, maxScore: 15, reasons: [] },  // New category for URL path analysis
    whois: { score: 0, maxScore: 25, reasons: [] },     // Adjusted weighting
    reputation: { score: 0, maxScore: 25, reasons: [] }, // Adjusted weighting
    threatIntel: { score: 0, maxScore: 15, reasons: [] }
  };
  
  // Domain analysis (20 points)
  analyzeDomain(domain, scores.domain);
  
  // URL path analysis (15 points) - new analysis
  analyzeUrlPath(fullUrl, scores.urlPath);
  
  // WHOIS analysis (25 points)
  if (whoisData) {
    analyzeWhois(whoisData, scores.whois);
  } else {
    scores.whois.reasons.push('WHOIS data unavailable');
    // Penalize more for missing WHOIS data
    scores.whois.score = Math.round(scores.whois.maxScore * 0.4); // Only 40% of max score
  }
  
  // Reputation analysis (25 points)
  if (reputationData) {
    analyzeReputation(reputationData, scores.reputation);
  } else {
    scores.reputation.reasons.push('Reputation data unavailable');
    // Penalize more for missing reputation data
    scores.reputation.score = Math.round(scores.reputation.maxScore * 0.4); // Only 40% of max score
  }
  
  // Threat intelligence analysis (15 points)
  if (intelligenceData) {
    analyzeThreatIntelligence(intelligenceData, scores.threatIntel);
  } else {
    scores.threatIntel.reasons.push('Threat intelligence data unavailable');
    // Penalize more for missing threat intel
    scores.threatIntel.score = Math.round(scores.threatIntel.maxScore * 0.4); // Only 40% of max score
  }
  
  // Calculate overall score (0-100)
  let totalScore = Object.values(scores).reduce((sum, category) => sum + category.score, 0);
  const maxPossibleScore = Object.values(scores).reduce((sum, category) => sum + category.maxScore, 0);
  
  // Special case: If URL path contains '/ET/' pattern, override score to be at most 50
  if (fullUrl.toLowerCase().includes('/et/')) {
    totalScore = Math.min(totalScore, 50);
  }
  
  // Generate safety rating with EVEN STRICTER thresholds
  let safetyRating, safetyLevel;
  if (totalScore >= 90) {  // Increased from 85
    safetyRating = 'SAFE';
    safetyLevel = 'low';
  } else if (totalScore >= 75) {  // Increased from 70
    safetyRating = 'PROBABLY SAFE';
    safetyLevel = 'low';
  } else if (totalScore >= 60) {  // Increased from 55
    safetyRating = 'SUSPICIOUS';
    safetyLevel = 'medium';
  } else if (totalScore >= 45) {  // Increased from 40
    safetyRating = 'LIKELY PHISHING';
    safetyLevel = 'high';
  } else {
    safetyRating = 'DANGEROUS';
    safetyLevel = 'critical';
  }
  
  // Compile reasons for the verdict
  const allReasons = [];
  Object.entries(scores).forEach(([category, data]) => {
    if (data.reasons.length > 0) {
      allReasons.push(...data.reasons.slice(0, 3)); // Limit to top 3 reasons per category
    }
  });
  
  return {
    domain,
    url: fullUrl,
    safetyRating,
    safetyLevel,
    score: totalScore,
    maxScore: maxPossibleScore,
    scorePercentage: Math.round((totalScore / maxPossibleScore) * 100),
    breakdown: scores,
    topReasons: allReasons.slice(0, 5), // Limit to top 5 reasons overall
    timestamp: new Date().toISOString(),
    rawData: {
      whois: whoisData,
      reputation: reputationData,
      threatIntelligence: intelligenceData
    }
  };
}

/**
 * Analyze URL path for phishing indicators
 */
function analyzeUrlPath(fullUrl, scoreObj) {
  let score = scoreObj.maxScore; // Start with full score and deduct
  
  try {
    const urlObj = new URL(fullUrl);
    const path = urlObj.pathname;
    const query = urlObj.search;
    
    // Check for suspicious path patterns
    
    // Check for brand impersonation in paths
    const brandTerms = ['paypal', 'apple', 'microsoft', 'amazon', 'google', 'facebook', 'netflix', 'bank', 'secure', 
                        'login', 'signin', 'account', 'verify', 'password', 'update', 'recover', 'confirm'];
    
    // Count how many brand terms appear in the path
    let brandTermCount = 0;
    brandTerms.forEach(term => {
      if (path.toLowerCase().includes(term)) {
        brandTermCount++;
      }
    });
    
    if (brandTermCount >= 2) {
      score -= 8;
      scoreObj.reasons.push(`URL path contains multiple brand/security terms (${brandTermCount})`);
    } else if (brandTermCount === 1) {
      score -= 4;
      scoreObj.reasons.push('URL path contains a brand or security-related term');
    }
    
    // Check for deceptive file extensions
    if (/\.(php|html|htm|asp|aspx)$/i.test(path) && path.includes('/')) {
      score -= 3;
      scoreObj.reasons.push('URL path uses web file extensions in nested directories');
    }
    
    // Check for suspicious path structure
    if (path.split('/').length > 3) {
      score -= 2;
      scoreObj.reasons.push('Deeply nested URL path structure');
    }
    
    // Check for obfuscation techniques
    if (path.includes('%') || path.includes('..') || path.includes('//')) {
      score -= 5;
      scoreObj.reasons.push('URL path contains obfuscation patterns');
    }
    
    // Check for excessive use of numbers or random strings
    const randomStringPattern = /\/[a-z0-9]{8,}\//i;
    if (randomStringPattern.test(path)) {
      score -= 4;
      scoreObj.reasons.push('URL path contains random-looking strings');
    }
    
    // Check specifically for any URL having /ET/ or /et/ which is a known phishing pattern
    // Use case-insensitive check
    if (path.toLowerCase().includes('/et/')) {
      score -= 15; // Much higher penalty
      scoreObj.reasons.push('URL contains high-risk pattern "/ET/" (known phishing indicator)');
    }
    
    // Check for suspicious query parameters
    if (query) {
      if (query.toLowerCase().includes('token=') || 
          query.toLowerCase().includes('access=') || 
          query.toLowerCase().includes('account')) {
        score -= 3;
        scoreObj.reasons.push('URL contains sensitive query parameters');
      }
      
      // Check for excessively long query strings (potential obfuscation)
      if (query.length > 100) {
        score -= 3;
        scoreObj.reasons.push('Unusually long query string');
      }
    }
    
  } catch (error) {
    score -= 5;
    scoreObj.reasons.push('Error analyzing URL path (possibly malformed)');
  }
  
  scoreObj.score = Math.max(0, score);
  if (scoreObj.score === scoreObj.maxScore && scoreObj.reasons.length === 0) {
    scoreObj.reasons.push('URL path appears normal');
  }
}

/**
 * Analyze domain characteristics
 */
function analyzeDomain(domain, scoreObj) {
  let score = scoreObj.maxScore; // Start with full score and deduct
  
  // Check for suspicious patterns
  if (domain.includes('secure') || domain.includes('account') || domain.includes('signin')) {
    score -= 3;
    scoreObj.reasons.push('Domain contains common phishing keywords');
  }
  
  // Check for excessive hyphens or numbers
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount > 2) {
    score -= 3;
    scoreObj.reasons.push('Domain contains excessive hyphens');
  }
  
  // Check for random-looking subdomains
  if (/[a-z0-9]{8,}\./i.test(domain)) {
    score -= 3;
    scoreObj.reasons.push('Domain contains random-looking characters');
  }
  
  // Check for misleading TLDs
  const popularTLDs = ['.com', '.org', '.net', '.edu', '.gov'];
  if (!popularTLDs.some(tld => domain.endsWith(tld))) {
    score -= 2;
    scoreObj.reasons.push('Domain uses less common TLD');
  }
  
  // Check for lookalike domains (homograph attacks)
  if (domain.includes('xn--')) {
    score -= 8;
    scoreObj.reasons.push('Domain uses punycode (potential homograph attack)');
  }
  
  scoreObj.score = Math.max(0, score);
  if (scoreObj.score === scoreObj.maxScore) {
    scoreObj.reasons.push('Domain structure appears normal');
  }
}

/**
 * Analyze WHOIS data for suspicious patterns
 */
function analyzeWhois(whoisData, scoreObj) {
  let score = scoreObj.maxScore; // Start with full score and deduct
  
  // Check domain age
  if (!whoisData.createdDate) {
    score -= 5;
    scoreObj.reasons.push('Creation date unavailable');
  } else {
    const domainAge = calculateDomainAge(whoisData.createdDate);
    if (domainAge < 30) {
      score -= 10;
      scoreObj.reasons.push('Domain is less than 30 days old');
    } else if (domainAge < 90) {
      score -= 6;
      scoreObj.reasons.push('Domain is less than 3 months old');
    } else if (domainAge < 365) {
      score -= 3;
      scoreObj.reasons.push('Domain is less than 1 year old');
    } else {
      scoreObj.reasons.push(`Domain is ${Math.floor(domainAge/365)} years old`);
    }
  }
  
  // Check for private registration
  if (!whoisData.registrantOrg) {
    score -= 3;
    scoreObj.reasons.push('Private registration or missing registrant info');
  }
  
  // Check expiry date
  if (whoisData.expiresDate) {
    const expiryDate = new Date(whoisData.expiresDate);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (expiryDate < oneYearFromNow) {
      score -= 3;
      scoreObj.reasons.push('Domain expires in less than a year');
    }
  }
  
  // Check name servers
  if (!whoisData.nameServers || whoisData.nameServers.length < 2) {
    score -= 3;
    scoreObj.reasons.push('Insufficient name servers');
  }
  
  scoreObj.score = Math.max(0, score);
  if (scoreObj.score === scoreObj.maxScore) {
    scoreObj.reasons.push('WHOIS data shows no suspicious patterns');
  }
}

/**
 * Analyze domain reputation data
 */
function analyzeReputation(reputationData, scoreObj) {
  let score = scoreObj.maxScore; // Start with full score and deduct
  
  if (!reputationData.reputationScore) {
    score -= 15;
    scoreObj.reasons.push('No reputation score available');
  } else {
    const repScore = reputationData.reputationScore;
    
    if (repScore < 50) {
      score -= 20;
      scoreObj.reasons.push(`Very low reputation score (${repScore}/100)`);
    } else if (repScore < 70) {
      score -= 15;
      scoreObj.reasons.push(`Low reputation score (${repScore}/100)`);
    } else if (repScore < 85) {
      score -= 7;
      scoreObj.reasons.push(`Medium reputation score (${repScore}/100)`);
    } else {
      scoreObj.reasons.push(`Good reputation score (${repScore}/100)`);
    }
  }
  
  // Check for malicious activities
  if (reputationData.hasOwnProperty('maliciousActivity') && reputationData.maliciousActivity) {
    score -= 15;
    scoreObj.reasons.push('Domain has known malicious activity');
  }
  
  scoreObj.score = Math.max(0, score);
  if (scoreObj.score === scoreObj.maxScore) {
    scoreObj.reasons.push('Domain has excellent reputation');
  }
}

/**
 * Analyze threat intelligence data
 */
function analyzeThreatIntelligence(threatData, scoreObj) {
  let score = scoreObj.maxScore; // Start with full score and deduct
  
  // Check if the domain is in any blacklists
  if (threatData.hasOwnProperty('blackLists') && threatData.blackLists.length > 0) {
    const blacklistCount = threatData.blackLists.length;
    if (blacklistCount >= 3) {
      score -= 20;
      scoreObj.reasons.push(`Domain appears on ${blacklistCount} blacklists`);
    } else if (blacklistCount > 0) {
      score -= 10;
      scoreObj.reasons.push(`Domain appears on ${blacklistCount} blacklists`);
    }
  }
  
  // Check for reported threats
  if (threatData.hasOwnProperty('reports') && threatData.reports.length > 0) {
    score -= 15;
    scoreObj.reasons.push('Domain has reported security threats');
  }
  
  scoreObj.score = Math.max(0, score);
  if (scoreObj.score === scoreObj.maxScore) {
    scoreObj.reasons.push('No security threats detected');
  }
}

/**
 * Calculate domain age in days
 */
function calculateDomainAge(createdDate) {
  const createDate = new Date(createdDate);
  const currentDate = new Date();
  const ageInMilliseconds = currentDate - createDate;
  return ageInMilliseconds / (1000 * 60 * 60 * 24); // Convert to days
}


