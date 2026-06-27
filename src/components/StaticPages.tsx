/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from './Router.jsx';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export function PrivacyPolicy() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 group transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Privacy Policy</h1>
              <p className="text-sm text-slate-500">Last updated: June 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 leading-relaxed font-sans text-sm sm:text-base">
            <p>
              Welcome to Confessly. Your privacy is paramount to us. Because we provide an anonymous submission platform, we want to be fully transparent about what data we collect, why we collect it, and how we protect it.
            </p>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">1. Anonymous Submissions</h2>
            <p>
              When you send an anonymous confession, we do not require your name, email address, or any registration credentials. The optional nickname and message are fully self-authored.
            </p>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">2. Collected Metadata</h2>
            <p>
              To maintain service integrity, prevent abuse, filter spam, and provide geographic analytics to system administrators, we collect the following network metadata upon submission:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2 text-slate-500 text-sm">
              <li>Internet Protocol (IP) address</li>
              <li>Approximate location (derived from IP address hash)</li>
              <li>Browser user-agent string (detecting Browser, Operating System, and Device Type)</li>
              <li>Screen resolution, language preferences, and timezone</li>
              <li>Submission timestamps</li>
            </ul>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">3. Administrator Controls and Audit Logs</h2>
            <p>
              For security, verification, and audit purposes, administrative actions (e.g., logging in, approving/rejecting messages, resetting passwords) are fully logged. Administrative metadata such as IP addresses and location coordinates are actively tracked in secure system logs.
            </p>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">4. Abuse Prevention and Blocking</h2>
            <p>
              We maintain an IP-based blacklist and automatic profanity filter keywords. Submissions violating safety guidelines will be permanently deleted and may result in temporary or permanent IP blocking.
            </p>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">5. Cookies and Security</h2>
            <p>
              We use lightweight, non-tracking local state tokens to store secure session identifiers for authenticated administrative and super-administrative panel users. No third-party tracking cookies are deployed on visitors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TermsOfService() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 group transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Terms of Service</h1>
              <p className="text-sm text-slate-500">Last updated: June 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 leading-relaxed font-sans text-sm sm:text-base">
            <p>
              By accessing and using Confessly, you agree to comply with and be bound by the following terms and conditions.
            </p>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">1. Authorized Usage</h2>
            <p>
              Confessly is designed for entertainment, lighthearted communication, constructive feedback, and anonymous expressions. You agree not to use the platform for:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2 text-slate-500 text-sm">
              <li>Bullying, personal harassment, or stalking of any specific individuals.</li>
              <li>Inciting violence, hate speech, or discrimination based on race, gender, or orientation.</li>
              <li>Spamming, promoting commercial services, or dispersing phishing links.</li>
              <li>Attempting to overload, hack, or inject payloads into our submission engine.</li>
            </ul>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">2. Content Moderation</h2>
            <p>
              All submissions enter a moderation queue. Platform administrators reserve the absolute right to approve, reject, favorite, reply to, or permanently delete any confession at their sole discretion. Violations of terms will result in immediate content removal and potential blacklisting of the offending IP address.
            </p>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">3. User Responsibility</h2>
            <p>
              You understand that you are solely responsible for the content you submit. Confessly assumes zero liability for user-submitted text, and user content does not represent the opinions of the platform owners or administrators.
            </p>

            <h2 className="text-xl font-display font-semibold text-slate-900 mt-8">4. Disclaimer of Warranties</h2>
            <p>
              The platform is provided "as is" and "as available". We do not guarantee uninterrupted, secure, or bug-free operations. We reserve the right to suspend accounts or wipe database elements at any time for website upgrades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
