// src/pages/company/components/company-revenue/components/ProjectDetailsModal.jsx
import React from 'react';

const ProjectDetailsModal = ({ 
  isOpen, 
  project, 
  onClose, 
  formatCurrency, 
  formatDate,
  calculateEndDate 
}) => {
  if (!isOpen || !project) return null;

  const totalAmount = project.totalAmount || project.paymentDetails?.totalAmount || 0;
  const receivedAmount = project.receivedAmount || project.paymentDetails?.amountPaidToCompany || 0;
  const pendingAmount = project.pendingAmount || (totalAmount - receivedAmount);

  return (
    <div className="revenue-modal" onClick={onClose}>
      <div className="revenue-modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
        <span className="revenue-close-modal" onClick={onClose}>
          &times;
        </span>
        <h2 className="revenue-modal-project-name" style={{borderBottom: '3px solid #1a73e8', paddingBottom: '15px', marginBottom: '20px'}}>
          {project.projectName}
        </h2>

        {/* Summary Cards */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px'}}>
          <div style={{padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #1a73e8'}}>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>Total Project Value</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#1a73e8'}}>{formatCurrency(totalAmount)}</div>
          </div>
          <div style={{padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #4caf50'}}>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>Amount Received</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#4caf50'}}>{formatCurrency(receivedAmount)}</div>
          </div>
          <div style={{padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', borderLeft: '4px solid #f44336'}}>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>Pending Payment</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#f44336'}}>{formatCurrency(pendingAmount)}</div>
          </div>
        </div>

        {/* Phase-wise Breakdown */}
        {project.phaseBreakdown && project.phaseBreakdown.length > 0 && (
          <div style={{marginBottom: '25px'}}>
            <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333'}}>
              📊 Phase-wise Payment Breakdown
            </h3>
            <div style={{display: 'grid', gap: '12px'}}>
              {project.phaseBreakdown.map((phase, idx) => {
                const phaseCollectionRate = phase.amount > 0 ? (phase.paid / phase.amount * 100).toFixed(1) : 0;
                
                return (
                  <div 
                    key={idx}
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '15px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #1a73e8'
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                      <div>
                        <strong style={{fontSize: '14px', color: '#1a73e8'}}>
                          {phase.name}
                        </strong>
                        <span style={{
                          marginLeft: '10px', 
                          fontSize: '11px', 
                          padding: '3px 8px', 
                          backgroundColor: phase.status === 'approved' ? '#4caf50' : phase.status === 'pending' ? '#ff9800' : '#9e9e9e',
                          color: 'white',
                          borderRadius: '12px'
                        }}>
                          {phase.status === 'approved' ? '✓ Approved' : phase.status === 'pending' ? '⏳ Pending' : 'Not Started'}
                        </span>
                      </div>
                      <div style={{fontSize: '16px', fontWeight: 'bold', color: '#1a73e8'}}>
                        {phase.percentage}%
                      </div>
                    </div>
                    
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '13px'}}>
                      <div>
                        <div style={{color: '#666'}}>Phase Amount</div>
                        <strong>{formatCurrency(phase.amount)}</strong>
                      </div>
                      <div>
                        <div style={{color: '#4caf50'}}>Received</div>
                        <strong style={{color: '#4caf50'}}>{formatCurrency(phase.paid)}</strong>
                      </div>
                      <div>
                        <div style={{color: '#f44336'}}>Pending</div>
                        <strong style={{color: '#f44336'}}>{formatCurrency(phase.pending)}</strong>
                      </div>
                      <div>
                        <div style={{color: '#666'}}>Collection Rate</div>
                        <strong>{phaseCollectionRate}%</strong>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {(phase.initialReleased > 0 || phase.heldAmount > 0 || phase.platformFee > 0) && (
                      <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc'}}>
                        <div style={{fontSize: '11px', color: '#666', marginBottom: '5px'}}>Payment Details:</div>
                        <div style={{display: 'flex', gap: '15px', fontSize: '11px'}}>
                          {phase.initialReleased > 0 && (
                            <div>
                              <span style={{color: '#666'}}>Initial 75%:</span> 
                              <strong style={{marginLeft: '4px', color: '#4caf50'}}>{formatCurrency(phase.initialReleased)}</strong>
                            </div>
                          )}
                          {phase.heldAmount > 0 && (
                            <div>
                              <span style={{color: '#666'}}>Held 25%:</span> 
                              <strong style={{marginLeft: '4px', color: '#4caf50'}}>{formatCurrency(phase.heldAmount)}</strong>
                            </div>
                          )}
                          {phase.platformFee > 0 && (
                            <div>
                              <span style={{color: '#666'}}>Platform Fee:</span> 
                              <strong style={{marginLeft: '4px', color: phase.platformFeeStatus === 'collected' ? '#4caf50' : '#b45309'}}>{formatCurrency(phase.platformFee)}</strong>
                            </div>
                          )}
                        </div>
                        {phase.platformFee > 0 && (
                          <div style={{marginTop: '6px', fontSize: '11px', color: phase.platformFeeStatus === 'collected' ? '#15803d' : '#b45309'}}>
                            Platform fee status: {phase.platformFeeStatus === 'collected' ? 'Collected' : phase.platformFeeStatus === 'pending' ? 'Pending collection' : 'Not due yet'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div style={{marginTop: '10px'}}>
                      <div style={{width: '100%', height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden'}}>
                        <div style={{
                          width: `${phaseCollectionRate}%`, 
                          height: '100%', 
                          backgroundColor: '#1a73e8',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Info - Grid Layout */}
        <div style={{backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px'}}>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333'}}>
            📋 Project Information
          </h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px'}}>
            <div>
              <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Client</div>
              <div style={{fontSize: '14px', fontWeight: '600', color: '#333'}}>{project.customerName || "N/A"}</div>
            </div>
            <div>
              <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Location</div>
              <div style={{fontSize: '14px', fontWeight: '600', color: '#333'}}>{project.projectAddress || "N/A"}</div>
            </div>
            <div>
              <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Start Date</div>
              <div style={{fontSize: '14px', fontWeight: '600', color: '#333'}}>{formatDate(project.createdAt)}</div>
            </div>
            <div>
              <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>
                {project.status === "completed" ? "End Date" : "Est. End Date"}
              </div>
              <div style={{fontSize: '14px', fontWeight: '600', color: '#333'}}>{calculateEndDate(project)}</div>
            </div>
          </div>
          
          <div style={{marginTop: '15px'}}>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Overall Completion</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <div style={{flex: 1, height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden'}}>
                <div style={{
                  width: `${project.completionPercentage || 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #1a73e8, #4caf50)',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div style={{fontSize: '16px', fontWeight: 'bold', color: '#1a73e8', minWidth: '50px'}}>
                {project.completionPercentage || 0}%
              </div>
            </div>
          </div>

          {project.proposal?.description && (
            <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd'}}>
              <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Description</div>
              <div style={{fontSize: '14px', color: '#555', lineHeight: '1.6'}}>{project.proposal.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
