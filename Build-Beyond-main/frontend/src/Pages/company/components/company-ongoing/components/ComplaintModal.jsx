// src/pages/company/components/company-ongoing/components/ComplaintModal.jsx
import React from 'react';
import Modal from 'react-modal';

const ComplaintModal = ({ 
  showComplaintModal, 
  handleCloseComplaint, 
  complaintText, 
  setComplaintText, 
  handleSubmitComplaint, 
  complaintLoading, 
  complaintSuccess, 
  complaintError,
  complaintHistory,
  complaintHistoryLoading
}) => {
  return (
    <Modal
      isOpen={!!showComplaintModal}
      onRequestClose={handleCloseComplaint}
      contentLabel="Complaint Modal"
      ariaHideApp={false}
      className="ongoing-complaint-modal"
      overlayClassName="ongoing-complaint-overlay"
    >
      <h2>Report/Complaint</h2>
      <button 
        onClick={handleCloseComplaint} 
        className="ongoing-complaint-close"
      >
        ✖
      </button>
      <div className="ongoing-complaint-textarea-wrapper">
        <textarea
          rows={4}
          className="ongoing-complaint-textarea"
          placeholder="Describe your complaint or issue..."
          value={complaintText[showComplaintModal] || ''}
          onChange={e => setComplaintText(prev => ({ 
            ...prev, 
            [showComplaintModal]: e.target.value 
          }))}
        />
      </div>
      {complaintError && (
        <div className="ongoing-complaint-error">{complaintError}</div>
      )}
      {complaintSuccess && (
        <div className="ongoing-complaint-success">
          Complaint submitted successfully!
        </div>
      )}

      <div className="ongoing-complaint-textarea-wrapper" style={{ marginTop: '14px' }}>
        <strong style={{ display: 'block', marginBottom: '8px' }}>Complaint Thread</strong>
        {complaintHistoryLoading ? (
          <p style={{ margin: 0, color: '#64748b' }}>Loading complaint history...</p>
        ) : complaintHistory?.length ? (
          <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
            {complaintHistory.map((item) => (
              <div key={item._id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 6px 0' }}><strong>You:</strong> {item.message}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b' }}>{new Date(item.createdAt).toLocaleString()}</p>
                {item.replies?.length ? item.replies.map((reply) => (
                  <p key={reply._id || `${reply.adminId}-${reply.createdAt}`} style={{ margin: '4px 0 0 0', color: '#1e293b' }}>
                    <strong>{reply.adminName || 'Platform Manager'}:</strong> {reply.message}
                  </p>
                )) : (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>No reply yet</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#94a3b8' }}>No complaints for this milestone yet.</p>
        )}
      </div>

      <button
        onClick={() => {
          const [projectId, milestone] = showComplaintModal.split('_');
          handleSubmitComplaint(projectId, milestone);
        }}
        disabled={complaintLoading || !(complaintText[showComplaintModal] && complaintText[showComplaintModal].trim())}
        className="ongoing-complaint-submit"
      >
        {complaintLoading ? 'Submitting...' : 'Submit Complaint'}
      </button>
    </Modal>
  );
};

export default ComplaintModal;
