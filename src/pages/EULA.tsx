export default function EULA() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
        <h1>End-User License Agreement (EULA)</h1>
        <p className="text-muted-foreground">Last updated: January 11, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using this application, you accept and agree to be bound by 
          the terms and provisions of this agreement. If you do not agree to these terms, 
          please do not use the application.
        </p>

        <h2>2. License Grant</h2>
        <p>
          We grant you a limited, non-exclusive, non-transferable, revocable license 
          to use the application for your personal or business expense management purposes, 
          subject to these terms.
        </p>

        <h2>3. Restrictions</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Copy, modify, or distribute the application</li>
          <li>Reverse engineer or attempt to extract source code</li>
          <li>Use the application for any unlawful purpose</li>
          <li>Share your account credentials with others</li>
          <li>Attempt to circumvent security measures</li>
        </ul>

        <h2>4. Third-Party Integrations</h2>
        <p>
          This application integrates with QuickBooks by Intuit. Your use of QuickBooks 
          data through our application is also subject to Intuit's terms of service. 
          We are not responsible for the availability or accuracy of data from third-party services.
        </p>

        <h2>5. Data Accuracy</h2>
        <p>
          While we strive to accurately import and display your financial data, you are 
          responsible for verifying the accuracy of all information. This application 
          is a tool to assist with expense management and should not be the sole source 
          for financial decisions.
        </p>

        <h2>6. Disclaimer of Warranties</h2>
        <p>
          THE APPLICATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM 
          ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, 
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
          CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE APPLICATION.
        </p>

        <h2>8. Termination</h2>
        <p>
          We may terminate or suspend your access to the application at any time, 
          without prior notice, for conduct that we believe violates these terms 
          or is harmful to other users or us.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use of 
          the application after changes constitutes acceptance of the new terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about this EULA, please contact us through the application.
        </p>
      </div>
    </div>
  );
}
