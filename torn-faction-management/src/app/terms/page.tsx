// src/app/terms/page.tsx
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header / Back Button */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-slate-400 hover:text-blue-400 transition">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Main Content Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-10 shadow-xl">
          <div className="flex items-center space-x-3 mb-8 border-b border-slate-800 pb-6">
            <ShieldCheck size={32} className="text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Terms & Privacy Policy</h1>
          </div>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Torn API Key Security</h2>
              <p>
                We understand the sensitivity of your Torn API key. By providing your limited or full-access key, you agree to its use solely for automating faction data synchronization. 
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2 text-slate-400">
                <li><strong className="text-slate-200">Encryption:</strong> Your API key is encrypted immediately upon submission and stored securely in our database.</li>
                <li><strong className="text-slate-200">Zero Raw Access:</strong> Our system design ensures that developers and administrators cannot view your raw, unencrypted API key.</li>
                <li><strong className="text-slate-200">Revocation:</strong> You can delete your API key from our systems at any time via your Settings page.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Email & Communication Policy</h2>
              <p>
                We respect your inbox. The email address associated with your account will <strong>never</strong> be sold, shared, or used for marketing purposes.
              </p>
              <p className="mt-2 text-slate-400">
                You will only receive emails for critical security events, such as password resets or account verification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Torn API Compliance</h2>
              <p>
                This application acts as a third-party tool and is <strong>not affiliated with, endorsed by, or sponsored by Torn Ltd.</strong> By using this service, you also agree to abide by the official <a href="https://www.torn.com/api.html" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">Torn API Terms and Conditions</a>.
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2 text-slate-400">
                <li>You are responsible for ensuring your API usage does not intentionally abuse or overload the Torn servers.</li>
                <li>If Torn Ltd revokes your API access due to a violation of their rules, this service will cease to function for your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Data Retention</h2>
              <p>
                We periodically sync and store data relevant to your faction's armory, members, and activities to provide you with historical insights. If you choose to delete your account, all associated user data and encrypted API keys will be permanently purged from our active databases.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Disclaimer of Warranties</h2>
              <p className="text-sm text-slate-500 italic">
                This software is provided "as is", without warranty of any kind, express or implied. In no event shall the developers be liable for any claim, damages, or other liability arising from your use of the application, including but not limited to in-game consequences resulting from the use of this third-party tool.
              </p>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}