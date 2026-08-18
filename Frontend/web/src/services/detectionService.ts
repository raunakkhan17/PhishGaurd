export interface URLCheckRequest {
  url: string;
}

export interface URLCheckResponse {
  domain: string;
  url: string;
  safetyRating: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  safetyLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  maxScore: number;
  scorePercentage: number;
  breakdown: {
    domain: { score: number; maxScore: number; reasons: string[] };
    urlPath: { score: number; maxScore: number; reasons: string[] };
    whois: { score: number; maxScore: number; reasons: string[] };
    reputation: { score: number; maxScore: number; reasons: string[] };
    threatIntel: { score: number; maxScore: number; reasons: string[] };
  };
  topReasons: string[];
  timestamp: string;
  rawData: {
    whois: {
      domainName: string;
      createdDate: string;
      updatedDate: string;
      expiresDate: string;
      registrar: string;
      registrantOrg: string;
      registrantCountry: string;
      nameServers: string[];
      status: string;
      estimatedDomainAge: number;
    } | null;
    reputation: {
      mode: string;
      reputationScore: number;
      testResults: Array<{
        test: string;
        testCode: number;
        warnings: Array<{ warningDescription: string; warningCode: number }>;
      }>;
    } | null;
    threatIntelligence: { total: number; results: any[] } | null;
  };
}

export interface DetectionStats {
  totalUrlsAnalyzed: number;
  threatsDetected: number;
  successRate: number;
  lastUpdated: string;
}

// ── Flask response shape ──────────────────────────────────────────────────────
interface FlaskPrediction {
  url: string;
  prediction: {
    ml_risk_score: number;
    prediction: string;
    URL: string;
    features: {
      url_length: number;
      domain_length: number;
      num_dots: number;
      num_hyphens: number;
      num_subdomains: number;
      is_https: number;
      has_port: number;
      num_suspicious_keywords: number;
      has_suspicious_tld: number;
      uses_free_hosting: number;
      num_special_chars: number;
    };
    inteligence_system: {
      malicious: number;
      suspicious: number;
      harmless: number;
      undetected: number;
      malicious_ratio: number;
      suspicious_ratio: number;
      domain_age_days: number;
      registrar_trustworthiness: string;
      registrant_email_type: string;
      registrant_name_authenticity: string;
      country_of_registrant: string;
      tld_country_mismatch: boolean;
      domain_status: string[];
      name_servers: string[];
    };
    behaviour_analysis: {
      has_password_field: boolean;
      has_external_form_action: boolean;
      has_hidden_iframe: boolean;
      suspicious_js: boolean;
      num_redirects: number;
    };
  };
}

// ── Map Flask response → URLCheckResponse ────────────────────────────────────
function mapFlaskToURLCheckResponse(raw: FlaskPrediction): URLCheckResponse {
  const p = raw.prediction;
  const intel = p.inteligence_system;
  const beh = p.behaviour_analysis;
  const feat = p.features;

  const isPhishing = p.prediction?.toLowerCase() !== 'legitimate';
  const riskScore = p.ml_risk_score ?? 0;

  // Safety rating
  let safetyRating: URLCheckResponse['safetyRating'];
  let safetyLevel: URLCheckResponse['safetyLevel'];
  if (!isPhishing && riskScore < 0.4) {
    safetyRating = 'SAFE';
    safetyLevel = 'low';
  } else if (riskScore < 0.7) {
    safetyRating = 'SUSPICIOUS';
    safetyLevel = riskScore < 0.55 ? 'medium' : 'high';
  } else {
    safetyRating = 'DANGEROUS';
    safetyLevel = 'critical';
  }

  // Overall safety score (inverse of risk, 0-100)
  const safetyScore = Math.round((1 - riskScore) * 100);

  // ── Domain breakdown ────────────────────────────────────────────────────────
  const domainReasons: string[] = [];
  let domainScore = 20;
  if (feat.num_suspicious_keywords > 0) {
    domainScore -= feat.num_suspicious_keywords * 3;
    domainReasons.push(`${feat.num_suspicious_keywords} suspicious keyword(s) in URL`);
  }
  if (feat.has_suspicious_tld) {
    domainScore -= 6;
    domainReasons.push('Suspicious top-level domain detected');
  }
  if (feat.num_hyphens > 2) {
    domainScore -= 3;
    domainReasons.push('Excessive hyphens in domain');
  }
  if (feat.num_dots > 3) {
    domainScore -= 3;
    domainReasons.push('Excessive subdomains detected');
  }
  if (feat.uses_free_hosting) {
    domainScore -= 5;
    domainReasons.push('Uses free hosting service');
  }
  if (domainReasons.length === 0) domainReasons.push('Domain structure appears normal');
  domainScore = Math.max(0, domainScore);

  // ── URL path breakdown ──────────────────────────────────────────────────────
  const urlPathReasons: string[] = [];
  let urlPathScore = 15;
  if (!feat.is_https) {
    urlPathScore -= 8;
    urlPathReasons.push('Connection is not secured with HTTPS');
  }
  if (feat.has_port) {
    urlPathScore -= 4;
    urlPathReasons.push('Non-standard port detected in URL');
  }
  if (feat.num_special_chars > 5) {
    urlPathScore -= 4;
    urlPathReasons.push('High number of special characters in URL');
  }
  if (urlPathReasons.length === 0) urlPathReasons.push('URL path looks clean');
  urlPathScore = Math.max(0, urlPathScore);

  // ── WHOIS breakdown ─────────────────────────────────────────────────────────
  const whoisReasons: string[] = [];
  let whoisScore = 25;
  const ageDays = intel.domain_age_days ?? 0;
  if (ageDays < 30) {
    whoisScore -= 15;
    whoisReasons.push('Domain is less than 30 days old');
  } else if (ageDays < 90) {
    whoisScore -= 8;
    whoisReasons.push('Domain is less than 3 months old');
  } else if (ageDays < 365) {
    whoisScore -= 4;
    whoisReasons.push('Domain is less than 1 year old');
  } else {
    whoisReasons.push(`Domain age: ${Math.floor(ageDays / 365)} year(s)`);
  }
  if (intel.tld_country_mismatch) {
    whoisScore -= 5;
    whoisReasons.push('TLD does not match registrant country');
  }
  if (intel.registrant_email_type !== 'Paid') {
    whoisScore -= 3;
    whoisReasons.push('Free or unknown registrant email type');
  }
  if (whoisReasons.length === 0) whoisReasons.push('WHOIS data shows no suspicious patterns');
  whoisScore = Math.max(0, whoisScore);

  // ── Reputation breakdown ────────────────────────────────────────────────────
  const reputationReasons: string[] = [];
  let reputationScore = 25;
  if (intel.malicious > 0) {
    reputationScore -= Math.min(20, intel.malicious * 5);
    reputationReasons.push(`Flagged as malicious by ${intel.malicious} source(s)`);
  }
  if (intel.suspicious > 0) {
    reputationScore -= Math.min(10, intel.suspicious * 3);
    reputationReasons.push(`Flagged as suspicious by ${intel.suspicious} source(s)`);
  }
  const trustMap: Record<string, number> = { High: 0, Medium: 8, Low: 15 };
  const trustPenalty = trustMap[intel.registrar_trustworthiness] ?? 8;
  if (trustPenalty > 0) {
    reputationScore -= trustPenalty;
    reputationReasons.push(`Registrar trustworthiness: ${intel.registrar_trustworthiness}`);
  }
  if (intel.harmless > 30) reputationReasons.push(`${intel.harmless} sources marked as harmless`);
  if (reputationReasons.length === 0) reputationReasons.push('No reputation issues found');
  reputationScore = Math.max(0, reputationScore);

  // ── Threat intel breakdown ──────────────────────────────────────────────────
  const threatReasons: string[] = [];
  let threatScore = 15;
  if (beh.has_password_field) {
    threatScore -= 4;
    threatReasons.push('Page contains a password input field');
  }
  if (beh.has_external_form_action) {
    threatScore -= 5;
    threatReasons.push('Form submits data to an external domain');
  }
  if (beh.has_hidden_iframe) {
    threatScore -= 4;
    threatReasons.push('Hidden iFrame detected on page');
  }
  if (beh.suspicious_js) {
    threatScore -= 4;
    threatReasons.push('Suspicious JavaScript patterns detected');
  }
  if (beh.num_redirects > 1) {
    threatScore -= 3;
    threatReasons.push(`${beh.num_redirects} redirect(s) detected`);
  }
  if (threatReasons.length === 0) threatReasons.push('No behavioural threats detected');
  threatScore = Math.max(0, threatScore);

  // ── Top reasons ─────────────────────────────────────────────────────────────
  const allReasons = [
    ...domainReasons,
    ...urlPathReasons,
    ...whoisReasons,
    ...reputationReasons,
    ...threatReasons,
  ].filter((r) => !r.toLowerCase().includes('appears normal') && !r.toLowerCase().includes('no '));
  const topReasons = allReasons.slice(0, 5);

  // ── Extract domain from URL ──────────────────────────────────────────────────
  let domain = raw.url;
  try {
    const u = new URL(raw.url.startsWith('http') ? raw.url : `https://${raw.url}`);
    domain = u.hostname;
  } catch {}

  return {
    domain,
    url: raw.url,
    safetyRating,
    safetyLevel,
    score: safetyScore,
    maxScore: 100,
    scorePercentage: safetyScore,
    breakdown: {
      domain: { score: domainScore, maxScore: 20, reasons: domainReasons },
      urlPath: { score: urlPathScore, maxScore: 15, reasons: urlPathReasons },
      whois: { score: whoisScore, maxScore: 25, reasons: whoisReasons },
      reputation: { score: reputationScore, maxScore: 25, reasons: reputationReasons },
      threatIntel: { score: threatScore, maxScore: 15, reasons: threatReasons },
    },
    topReasons,
    timestamp: new Date().toISOString(),
    rawData: {
      whois: {
        domainName: domain,
        createdDate: '',
        updatedDate: '',
        expiresDate: '',
        registrar: intel.registrar_trustworthiness,
        registrantOrg: intel.registrant_name_authenticity,
        registrantCountry: intel.country_of_registrant,
        nameServers: intel.name_servers ?? [],
        status: (intel.domain_status ?? []).join(', '),
        estimatedDomainAge: intel.domain_age_days,
      },
      reputation: {
        mode: 'ML + Intelligence',
        reputationScore: Math.round((intel.harmless / Math.max(1, intel.harmless + intel.malicious + intel.suspicious + intel.undetected)) * 100),
        testResults: [],
      },
      threatIntelligence: {
        total: intel.malicious + intel.suspicious,
        results: [],
      },
    },
  };
}

// ── Service ───────────────────────────────────────────────────────────────────
class DetectionService {
  private readonly STATS_KEY = 'detection_stats';
  private readonly HISTORY_KEY = 'detection_history';

  async checkURL(url: string): Promise<URLCheckResponse> {
    let response: Response;
    try {
      response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch (networkErr: any) {
      throw new Error(`Network error — is the Flask server running? (${networkErr.message})`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Server error ${response.status}: ${body || response.statusText}`);
    }

    let raw: FlaskPrediction;
    try {
      raw = await response.json();
    } catch {
      throw new Error('Invalid response from server — expected JSON');
    }

    console.log('[DetectionService] raw API response:', raw);

    if (!raw?.prediction) {
      throw new Error(`Unexpected response shape: ${JSON.stringify(raw).slice(0, 200)}`);
    }

    const result = mapFlaskToURLCheckResponse(raw);
    this.updateStats(result);
    this.addToHistory(result);
    return result;
  }

  getStats(): DetectionStats {
    const stored = localStorage.getItem(this.STATS_KEY);
    if (stored) return JSON.parse(stored);

    const defaultStats: DetectionStats = {
      totalUrlsAnalyzed: 0,
      threatsDetected: 0,
      successRate: 100,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(this.STATS_KEY, JSON.stringify(defaultStats));
    return defaultStats;
  }

  private updateStats(result: URLCheckResponse) {
    const stats = this.getStats();
    stats.totalUrlsAnalyzed += 1;
    if (result.safetyRating !== 'SAFE') stats.threatsDetected += 1;
    stats.successRate =
      ((stats.totalUrlsAnalyzed - stats.threatsDetected) / stats.totalUrlsAnalyzed) * 100;
    stats.lastUpdated = new Date().toISOString();
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }

  getHistory(): URLCheckResponse[] {
    const stored = localStorage.getItem(this.HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private addToHistory(result: URLCheckResponse) {
    const history = this.getHistory();
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify([result, ...history].slice(0, 20)));
  }

  clearHistory() {
    localStorage.removeItem(this.HISTORY_KEY);
  }

  resetStats() {
    localStorage.removeItem(this.STATS_KEY);
  }
}

export const detectionService = new DetectionService();
export default detectionService;
