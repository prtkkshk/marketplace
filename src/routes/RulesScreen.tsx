import React from 'react';
import { Card } from '../components/ui/Card';
import { ShieldAlert } from 'lucide-react';

export const RulesScreen: React.FC = () => {
  return (
    <div className="p-4 max-w-2xl mx-auto text-left py-6">
      <div className="flex items-center gap-3 mb-4">
        <ShieldAlert className="w-7 h-7 text-brand-primary" />
        <h1 className="text-xl font-bold text-content-primary">Campus Trading Rules & Policy</h1>
      </div>

      <Card className="mb-4">
        <h2 className="text-base font-bold text-content-primary mb-2">Prohibited Items (Zero Tolerance)</h2>
        <ul className="list-disc list-inside text-xs text-content-muted flex flex-col gap-1.5 leading-relaxed">
          <li><strong>Alcohol:</strong> In any quantity or form.</li>
          <li><strong>Drugs & Tobacco:</strong> Cigarettes, vapes, e-cigarettes, hookah gear, prescription substances.</li>
          <li><strong>Weapons:</strong> Knives beyond kitchen use, air guns, replicas, or dangerous items.</li>
          <li><strong>Academic Integrity Violations:</strong> Leaked exam papers, live course solution manuals, proxy services.</li>
          <li><strong>Room Sublets & Swaps:</strong> Hall allotments or room sublets are strictly prohibited.</li>
        </ul>
      </Card>

      <Card className="mb-4">
        <h2 className="text-base font-bold text-content-primary mb-2">Safety & Trade Disclaimer</h2>
        <p className="text-xs text-content-muted leading-relaxed mb-2">
          KGP Marketplace is a listing board only. All transactions occur off-platform directly between students in person on campus.
        </p>
        <p className="text-xs font-medium text-content-primary">
          Always meet in public campus spaces (e.g. Hall common room, Cedi, Nalanda) and inspect items before paying with UPI or cash.
        </p>
      </Card>
    </div>
  );
};
