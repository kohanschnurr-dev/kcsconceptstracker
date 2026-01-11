export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: January 11, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          When you use our application, we may collect the following information:
        </p>
        <ul>
          <li>Account information (email address, name)</li>
          <li>Financial data from connected services (QuickBooks expenses, transactions)</li>
          <li>Usage data and analytics</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and maintain our service</li>
          <li>Import and categorize your expenses from QuickBooks</li>
          <li>Improve and personalize your experience</li>
          <li>Communicate with you about updates and support</li>
        </ul>

        <h2>3. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your data. 
          Your QuickBooks credentials are never stored directly - we use OAuth tokens 
          which can be revoked at any time.
        </p>

        <h2>4. Third-Party Services</h2>
        <p>
          Our application integrates with QuickBooks by Intuit. When you connect your 
          QuickBooks account, you authorize us to access your financial data according 
          to Intuit's terms of service.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. You can request 
          deletion of your data at any time by disconnecting your QuickBooks account 
          and contacting us.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Delete your data</li>
          <li>Disconnect third-party integrations at any time</li>
        </ul>

        <h2>7. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us through the application.
        </p>
      </div>
    </div>
  );
}
