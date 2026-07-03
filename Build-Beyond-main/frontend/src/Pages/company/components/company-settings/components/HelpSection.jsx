import React from "react";

export default function HelpSection() {
  return (
    <section className="cs-section cs-active">
      <h2 className="cs-section-title">Help Center</h2>
      <div className="cs-faq">
        <div className="cs-did-you-know">
          <strong>How do I create a new project?</strong>
          <p>
            Go to the Dashboard and click the "New Project" button in the top right
            corner.
          </p>
        </div>
        <div className="cs-did-you-know">
          <strong>How do I invite team members?</strong>
          <p>
            Navigate to your project, click the "Team" tab, and use the "Invite Member"
            button.
          </p>
        </div>
        <div className="cs-did-you-know">
          <strong>How can I track my project's budget?</strong>
          <p>
            Use the "Finances" tab within your project to track expenses and compare
            with your budget.
          </p>
        </div>
        <div className="cs-actions">
          <button className="cs-btn-primary">Contact Support</button>
        </div>
      </div>
    </section>
  );
}
