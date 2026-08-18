import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Search, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import Toast from './Toast';

interface PhishingResult {
  url: string;
  prediction: {
    ml_risk_score: number;
    prediction: string;
    URL: string;
    features: {
      url_length: number;
      domain_length: number;
      path_length: number;
      query_length: number;
      is_ip: number;
      num_dots: number;
      num_hyphens: number;
      num_subdomains: number;
      is_https: number;
      has_port: number;
      num_digits: number;
      num_special_chars: number;
      num_suspicious_keywords: number;
      has_suspicious_tld: number;
      uses_free_hosting: number;
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

interface ThreatIntelligenceResult {
  total: number;
  results: Array<{
    firstSeen: string;
    lastSeen: string;
    threatType: string;
    iocType: string;
    value: string;
  }>;
}

const Tools: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'kavach' | 'intelligence'>('kavach');
  const [url, setUrl] = useState('');
  const [ioc, setIoc] = useState('apple*.com');
  const [loading, setLoading] = useState(false);
  const [phishingResult, setPhishingResult] = useState<PhishingResult | null>(null);
  const [threatResult, setThreatResult] = useState<ThreatIntelligenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  } | null>(null);

  const handlePhishingDetection = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze URL');
      }

      const result = await response.json();
      setPhishingResult(result);
      setToast({
        message: 'URL analysis completed successfully!',
        type: 'success',
        isVisible: true,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze URL';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    } finally {
      setLoading(false);
    }
  };

  const handleThreatIntelligence = async () => {
    if (!ioc.trim()) {
      setError('Please enter an IOC to search');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiKey = 'at_1UNgtzONHEkOWkrOGNcHVfPnzttxx';
      const response = await fetch(
        `https://threat-intelligence.whoisxmlapi.com/api/v1?apiKey=${apiKey}&ioc=${encodeURIComponent(ioc.trim())}&outputFormat=JSON`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch threat intelligence');
      }

      const result = await response.json();
      setThreatResult(result);
      setToast({ message: 'Threat intelligence search completed!', type: 'success', isVisible: true });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch threat intelligence';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    } finally {
      setLoading(false);
    }
  };

  const closeToast = () => setToast(null);

  const isPhishing = (result: PhishingResult) =>
    result.prediction.prediction?.toLowerCase() !== 'legitimate';

  const riskPercent = (result: PhishingResult) =>
    Math.round(result.prediction.ml_risk_score * 100);

  const riskColor = (result: PhishingResult) => {
    const score = riskPercent(result);
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const boolFlag = (val: boolean) =>
    val ? (
      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
        <XCircle className="h-4 w-4" /> Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
        <CheckCircle className="h-4 w-4" /> No
      </span>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Community</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Tools</h1>
              <p className="text-gray-600">Advanced threat detection and intelligence gathering tools</p>
            </div>
          </div>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('kavach')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'kavach' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Kavach
            </button>
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'intelligence' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="h-4 w-4 inline mr-2" />
              IntelligenceAPI
            </button>
          </div>
        </div>

        {/* Kavach Tab */}
        {activeTab === 'kavach' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Phishing Detection (Kavach)</h2>
            <p className="text-gray-600 mb-6">Analyze URLs for potential phishing threats using advanced AI detection</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL to Analyze
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePhishingDetection()}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handlePhishingDetection}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Analyze URL'}
                </button>
              </div>
            </div>

            {/* Results */}
            {phishingResult && (
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>

                {/* Verdict Banner */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  isPhishing(phishingResult)
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  {isPhishing(phishingResult) ? (
                    <XCircle className="h-8 w-8 text-red-600 shrink-0" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-600 shrink-0" />
                  )}
                  <div>
                    <div className={`text-xl font-bold ${isPhishing(phishingResult) ? 'text-red-700' : 'text-green-700'}`}>
                      {phishingResult.prediction.prediction}
                    </div>
                    <div className="text-sm text-gray-600 truncate">{phishingResult.url}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className={`text-3xl font-bold ${riskColor(phishingResult)}`}>
                      {riskPercent(phishingResult)}%
                    </div>
                    <div className="text-xs text-gray-500">ML Risk Score</div>
                  </div>
                </div>

                {/* Three cards: Intelligence / Behaviour / Domain */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* VirusTotal Intel */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" /> Threat Intelligence
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Malicious</span>
                        <span className={`font-semibold ${phishingResult.prediction.inteligence_system.malicious > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {phishingResult.prediction.inteligence_system.malicious}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Suspicious</span>
                        <span className={`font-semibold ${phishingResult.prediction.inteligence_system.suspicious > 0 ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {phishingResult.prediction.inteligence_system.suspicious}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harmless</span>
                        <span className="font-semibold text-green-600">
                          {phishingResult.prediction.inteligence_system.harmless}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Undetected</span>
                        <span className="font-semibold text-gray-800">
                          {phishingResult.prediction.inteligence_system.undetected}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-gray-600">Domain Age</span>
                        <span className="font-semibold text-gray-800">
                          {phishingResult.prediction.inteligence_system.domain_age_days.toLocaleString()} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trustworthiness</span>
                        <span className={`font-semibold ${
                          phishingResult.prediction.inteligence_system.registrar_trustworthiness === 'High'
                            ? 'text-green-600'
                            : phishingResult.prediction.inteligence_system.registrar_trustworthiness === 'Medium'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {phishingResult.prediction.inteligence_system.registrar_trustworthiness}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Behaviour Analysis */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" /> Behaviour Analysis
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Password Field</span>
                        {boolFlag(phishingResult.prediction.behaviour_analysis.has_password_field)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">External Form</span>
                        {boolFlag(phishingResult.prediction.behaviour_analysis.has_external_form_action)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hidden iFrame</span>
                        {boolFlag(phishingResult.prediction.behaviour_analysis.has_hidden_iframe)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Suspicious JS</span>
                        {boolFlag(phishingResult.prediction.behaviour_analysis.suspicious_js)}
                      </div>
                      <div className="flex justify-between items-center border-t pt-2 mt-2">
                        <span className="text-gray-600">Redirects</span>
                        <span className={`font-semibold ${phishingResult.prediction.behaviour_analysis.num_redirects > 1 ? 'text-red-600' : 'text-gray-800'}`}>
                          {phishingResult.prediction.behaviour_analysis.num_redirects}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Domain Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4 text-purple-600" /> Domain Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Country</span>
                        <span className="font-semibold text-gray-800">
                          {phishingResult.prediction.inteligence_system.country_of_registrant || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email Type</span>
                        <span className="font-semibold text-gray-800">
                          {phishingResult.prediction.inteligence_system.registrant_email_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">TLD Mismatch</span>
                        {boolFlag(phishingResult.prediction.inteligence_system.tld_country_mismatch)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">HTTPS</span>
                        {boolFlag(phishingResult.prediction.features.is_https === 1)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Suspicious Keywords</span>
                        <span className={`font-semibold ${phishingResult.prediction.features.num_suspicious_keywords > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {phishingResult.prediction.features.num_suspicious_keywords}
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <span className="text-gray-600 block mb-1">Name Servers</span>
                        {phishingResult.prediction.inteligence_system.name_servers.slice(0, 2).map((ns) => (
                          <div key={ns} className="text-xs text-gray-500 truncate">{ns}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Threat Intelligence API</h2>
            <p className="text-gray-600 mb-6">Search for threat intelligence data using IOC patterns</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <label htmlFor="ioc" className="block text-sm font-medium text-gray-700 mb-2">
                  IOC Pattern (e.g., apple*.com)
                </label>
                <input
                  type="text"
                  id="ioc"
                  value={ioc}
                  onChange={(e) => setIoc(e.target.value)}
                  placeholder="Enter IOC pattern to search"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleThreatIntelligence}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Searching...' : 'Search IOC'}
                </button>
              </div>
            </div>

            {threatResult && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Intelligence Results</h3>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-gray-700">Total Results: {threatResult.total}</span>
                  </div>
                </div>

                {threatResult.results.length > 0 && (
                  <div className="space-y-3">
                    {threatResult.results.slice(0, 20).map((result, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{result.value}</span>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            result.threatType === 'malware'
                              ? 'bg-red-100 text-red-800'
                              : result.threatType === 'suspicious'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result.threatType}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div><span className="font-medium">Type:</span> {result.iocType}</div>
                          <div><span className="font-medium">First Seen:</span> {new Date(result.firstSeen).toLocaleDateString()}</div>
                          <div><span className="font-medium">Last Seen:</span> {new Date(result.lastSeen).toLocaleDateString()}</div>
                          <div><span className="font-medium">Threat Level:</span> {result.threatType}</div>
                        </div>
                      </div>
                    ))}
                    {threatResult.results.length > 20 && (
                      <div className="text-center text-gray-500 py-4">
                        Showing first 20 of {threatResult.total} results
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
