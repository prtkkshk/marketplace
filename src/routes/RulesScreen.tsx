import React from 'react';
import { Card } from '../components/ui/Card';
import { ShieldAlert, ShieldCheck, MapPin } from 'lucide-react';

export const RulesScreen: React.FC = () => {
  return (
    <div className="p-4 max-w-2xl mx-auto text-left py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-8 h-8 text-brand-primary" />
        <div>
          <h1 className="text-xl font-bold text-content-primary">Campus Trading Rules & Policy</h1>
          <p className="text-xs text-content-muted">IIT Kharagpur second-hand marketplace guidelines (§11)</p>
        </div>
      </div>

      {/* Prohibited Items */}
      <Card className="mb-4">
        <h2 className="text-base font-bold text-content-primary mb-3 text-status-danger flex items-center gap-2">
          <span>🚫 Prohibited Items (Zero Tolerance)</span>
        </h2>
        <ul className="list-disc list-inside text-xs text-content-primary flex flex-col gap-2 leading-relaxed">
          <li>
            <strong>Alcohol:</strong> In any quantity, bottle, or form.
          </li>
          <li>
            <strong>Drugs & Tobacco:</strong> Cigarettes, vapes, e-cigarettes, hookah gear, and prescription or illegal substances.
          </li>
          <li>
            <strong>Weapons:</strong> Knives beyond basic kitchen cutlery, air guns, replicas, or dangerous materials.
          </li>
          <li>
            <strong>Academic Integrity Violations:</strong> Leaked exam papers, live course solution manuals, assignment proxies, or paid academic dishonesty services.
          </li>
          <li>
            <strong>Room Sublets & Swaps:</strong> Hall allotments, room exchanges, or room subletting are strictly prohibited.
          </li>
        </ul>
      </Card>

      {/* Enforcement Ladder */}
      <Card className="mb-4">
        <h2 className="text-base font-bold text-content-primary mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-primary" />
          <span>Moderation Enforcement Ladder</span>
        </h2>
        <div className="flex flex-col gap-2 text-xs text-content-muted leading-relaxed">
          <p>
            <strong>1st Offense:</strong> Immediate item deletion and warning notification.
          </p>
          <p>
            <strong>2nd Offense:</strong> 7-day account suspension from listing and contacting sellers.
          </p>
          <p>
            <strong>Severe / 3rd Offense:</strong> Permanent account ban across all institute cohorts.
          </p>
        </div>
      </Card>

      {/* Safety & In-Person Trade Disclaimer */}
      <Card className="mb-4 bg-brand-wash/40 border-brand-light">
        <h2 className="text-base font-bold text-brand-primary mb-2 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <span>Safety & Transaction Disclaimer</span>
        </h2>
        <p className="text-xs text-content-primary leading-relaxed mb-3">
          KGP Bazaar is a campus listing board only. There is no payment gateway and deals are closed off-platform in person.
        </p>
        <div className="p-3 bg-white rounded-xl border border-surface-border text-xs text-content-primary font-medium">
          💡 <strong>Best Practices:</strong> Always meet in public campus spaces (e.g. Hall common room, Cedi, Nalanda) and inspect the item before transferring funds via UPI or cash.
        </div>
      </Card>
    </div>
  );
};
