import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, Circle, AlertCircle, Target, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: 'completed' | 'missing' | 'optional';
  document_type?: string;
}

interface Purpose {
  id: string;
  name: string;
  description: string;
  requirements: ChecklistItem[];
}

const purposes: Purpose[] = [
  {
    id: 'passport',
    name: 'Passport Application',
    description: 'Documents required for Indian passport application',
    requirements: [
      {
        id: 'aadhar',
        name: 'Aadhar Card',
        description: 'Valid Aadhar card with current address',
        required: true,
        status: 'missing',
        document_type: 'aadhar'
      },
      {
        id: 'pan',
        name: 'PAN Card',
        description: 'Valid PAN card',
        required: true,
        status: 'missing',
        document_type: 'pan'
      },
      {
        id: 'birth_certificate',
        name: 'Birth Certificate',
        description: 'Original birth certificate or 10th class certificate',
        required: true,
        status: 'missing',
        document_type: 'birth_certificate'
      },
      {
        id: 'address_proof',
        name: 'Address Proof',
        description: 'Utility bill, bank statement, or rental agreement (not older than 3 months)',
        required: true,
        status: 'missing',
        document_type: 'address_proof'
      },
      {
        id: 'photo',
        name: 'Passport Size Photo',
        description: 'Recent passport size photograph (35mm x 35mm)',
        required: true,
        status: 'missing',
        document_type: 'photo'
      },
      {
        id: 'signature',
        name: 'Signature',
        description: 'Digital signature or scanned signature',
        required: true,
        status: 'missing',
        document_type: 'signature'
      }
    ]
  },
  {
    id: 'bank_account',
    name: 'Bank Account Opening',
    description: 'Documents required for opening a new bank account',
    requirements: [
      {
        id: 'aadhar',
        name: 'Aadhar Card',
        description: 'Valid Aadhar card',
        required: true,
        status: 'missing',
        document_type: 'aadhar'
      },
      {
        id: 'pan',
        name: 'PAN Card',
        description: 'Valid PAN card',
        required: true,
        status: 'missing',
        document_type: 'pan'
      },
      {
        id: 'address_proof',
        name: 'Address Proof',
        description: 'Utility bill, bank statement, or rental agreement',
        required: true,
        status: 'missing',
        document_type: 'address_proof'
      },
      {
        id: 'income_proof',
        name: 'Income Proof',
        description: 'Salary slip, ITR, or income certificate',
        required: true,
        status: 'missing',
        document_type: 'income_proof'
      },
      {
        id: 'photo',
        name: 'Passport Size Photo',
        description: 'Recent passport size photograph',
        required: true,
        status: 'missing',
        document_type: 'photo'
      }
    ]
  },
  {
    id: 'job_application',
    name: 'Job Application',
    description: 'Documents required for job applications',
    requirements: [
      {
        id: 'resume',
        name: 'Resume/CV',
        description: 'Updated resume with current information',
        required: true,
        status: 'missing',
        document_type: 'resume'
      },
      {
        id: 'aadhar',
        name: 'Aadhar Card',
        description: 'Valid Aadhar card',
        required: true,
        status: 'missing',
        document_type: 'aadhar'
      },
      {
        id: 'pan',
        name: 'PAN Card',
        description: 'Valid PAN card',
        required: true,
        status: 'missing',
        document_type: 'pan'
      },
      {
        id: 'education_certificates',
        name: 'Education Certificates',
        description: 'Degree certificates, mark sheets',
        required: true,
        status: 'missing',
        document_type: 'education_certificates'
      },
      {
        id: 'experience_letters',
        name: 'Experience Letters',
        description: 'Previous employment experience letters',
        required: false,
        status: 'missing',
        document_type: 'experience_letters'
      },
      {
        id: 'photo',
        name: 'Passport Size Photo',
        description: 'Recent passport size photograph',
        required: true,
        status: 'missing',
        document_type: 'photo'
      }
    ]
  },
  {
    id: 'driving_license',
    name: 'Driving License',
    description: 'Documents required for driving license application',
    requirements: [
      {
        id: 'aadhar',
        name: 'Aadhar Card',
        description: 'Valid Aadhar card',
        required: true,
        status: 'missing',
        document_type: 'aadhar'
      },
      {
        id: 'age_proof',
        name: 'Age Proof',
        description: 'Birth certificate, 10th certificate, or PAN card',
        required: true,
        status: 'missing',
        document_type: 'age_proof'
      },
      {
        id: 'address_proof',
        name: 'Address Proof',
        description: 'Utility bill or bank statement',
        required: true,
        status: 'missing',
        document_type: 'address_proof'
      },
      {
        id: 'medical_certificate',
        name: 'Medical Certificate',
        description: 'Medical fitness certificate from authorized doctor',
        required: true,
        status: 'missing',
        document_type: 'medical_certificate'
      }
    ]
  },
  {
    id: 'voter_id',
    name: 'Voter ID Card',
    description: 'Documents required for voter ID application',
    requirements: [
      {
        id: 'aadhar',
        name: 'Aadhar Card',
        description: 'Valid Aadhar card',
        required: true,
        status: 'missing',
        document_type: 'aadhar'
      },
      {
        id: 'age_proof',
        name: 'Age Proof',
        description: 'Birth certificate or 10th certificate',
        required: true,
        status: 'missing',
        document_type: 'age_proof'
      },
      {
        id: 'address_proof',
        name: 'Address Proof',
        description: 'Utility bill, bank statement, or rental agreement',
        required: true,
        status: 'missing',
        document_type: 'address_proof'
      },
      {
        id: 'photo',
        name: 'Passport Size Photo',
        description: 'Recent passport size photograph',
        required: true,
        status: 'missing',
        document_type: 'photo'
      }
    ]
  }
];

export default function SmartChecklist() {
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's documents
  useEffect(() => {
    loadDocuments();
  }, []);

  // Update checklist whenever purpose changes (show all as missing if no docs yet)
  useEffect(() => {
    if (selectedPurpose) {
      updateChecklist();
    }
  }, [selectedPurpose, documents]);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('documents')
        .select('id, document_name, document_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const updateChecklist = () => {
    const purpose = purposes.find(p => p.id === selectedPurpose);
    if (!purpose) return;

    const updatedChecklist = purpose.requirements.map(req => {
      // Enhanced document matching logic
      const hasDocument = documents.some(doc => {
        const docType = doc.document_type.toLowerCase();
        const docName = doc.document_name.toLowerCase();
        const reqType = req.document_type?.toLowerCase() || '';
        
        // Direct type matching
        if (docType.includes(reqType) || reqType.includes(docType)) return true;
        
        // Name-based matching for common documents
        const nameMatches = {
          'aadhar': ['aadhar', 'aadhaar', 'uid'],
          'pan': ['pan', 'pan card'],
          'birth_certificate': ['birth', 'certificate', '10th', 'ssc'],
          'address_proof': ['address', 'utility', 'bill', 'bank statement', 'rental'],
          'photo': ['photo', 'photograph', 'picture'],
          'signature': ['signature', 'sign'],
          'income_proof': ['income', 'salary', 'itr', 'tax'],
          'education_certificates': ['education', 'degree', 'certificate', 'marksheet', 'diploma'],
          'experience_letters': ['experience', 'employment', 'job', 'work'],
          'resume': ['resume', 'cv', 'curriculum vitae']
        };
        
        const keywords = nameMatches[reqType as keyof typeof nameMatches] || [];
        return keywords.some(keyword => 
          docName.includes(keyword) || docType.includes(keyword)
        );
      });

      return {
        ...req,
        status: hasDocument ? 'completed' : 'missing'
      };
    });

    setChecklist(updatedChecklist);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'missing':
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'missing':
        return <Badge variant="secondary">Missing</Badge>;
      default:
        return <Badge variant="outline">Optional</Badge>;
    }
  };

  const completedCount = checklist.filter(item => item.status === 'completed').length;
  const totalCount = checklist.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Smart suggestions based on current documents
  const getSmartSuggestions = () => {
    const suggestions = purposes.map(purpose => {
      const purposeChecklist = purpose.requirements.map(req => {
        const hasDocument = documents.some(doc => {
          const docType = doc.document_type.toLowerCase();
          const docName = doc.document_name.toLowerCase();
          const reqType = req.document_type?.toLowerCase() || '';
          
          if (docType.includes(reqType) || reqType.includes(docType)) return true;
          
          const nameMatches = {
            'aadhar': ['aadhar', 'aadhaar', 'uid'],
            'pan': ['pan', 'pan card'],
            'birth_certificate': ['birth', 'certificate', '10th', 'ssc'],
            'address_proof': ['address', 'utility', 'bill', 'bank statement', 'rental'],
            'photo': ['photo', 'photograph', 'picture'],
            'signature': ['signature', 'sign'],
            'income_proof': ['income', 'salary', 'itr', 'tax'],
            'education_certificates': ['education', 'degree', 'certificate', 'marksheet', 'diploma'],
            'experience_letters': ['experience', 'employment', 'job', 'work'],
            'resume': ['resume', 'cv', 'curriculum vitae']
          };
          
          const keywords = nameMatches[reqType as keyof typeof nameMatches] || [];
          return keywords.some(keyword => 
            docName.includes(keyword) || docType.includes(keyword)
          );
        });
        
        return { ...req, status: hasDocument ? 'completed' : 'missing' };
      });
      
      const completed = purposeChecklist.filter(item => item.status === 'completed').length;
      const total = purposeChecklist.length;
      const percentage = (completed / total) * 100;
      
      return {
        ...purpose,
        completionPercentage: percentage,
        completedCount: completed,
        totalCount: total
      };
    });
    
    return suggestions
      .filter(s => s.completionPercentage > 0)
      .sort((a, b) => b.completionPercentage - a.completionPercentage);
  };

  const smartSuggestions = getSmartSuggestions();

  return (
    <div className="space-y-6">
      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>
              Based on your uploaded documents, you can apply for:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {smartSuggestions.slice(0, 3).map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedPurpose(suggestion.id)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.name}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${suggestion.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.completedCount}/{suggestion.totalCount} documents
                      </span>
                    </div>
                  </div>
                  <Badge variant={suggestion.completionPercentage === 100 ? "default" : "secondary"}>
                    {suggestion.completionPercentage === 100 ? "Ready" : `${Math.round(suggestion.completionPercentage)}%`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Smart Document Checklist
          </CardTitle>
          <CardDescription>
            Get personalized document requirements based on your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Purpose:</label>
            <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
              <SelectTrigger>
                <SelectValue placeholder="Choose what you want to apply for..." />
              </SelectTrigger>
              <SelectContent>
                {purposes.map((purpose) => (
                  <SelectItem key={purpose.id} value={purpose.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{purpose.name}</span>
                      <span className="text-xs text-muted-foreground">{purpose.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPurpose && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {purposes.find(p => p.id === selectedPurpose)?.name} Requirements
                </h3>
                <div className="text-sm text-muted-foreground">
                  {completedCount}/{totalCount} completed
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      {item.required && (
                        <span className="inline-block text-xs text-red-500 mt-1">* Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Missing Documents Summary */}
              {checklist.filter(item => item.status === 'missing').length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Missing Documents</h4>
                  </div>
                  <div className="space-y-2">
                    {checklist
                      .filter(item => item.status === 'missing')
                      .slice(0, 3)
                      .map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <Circle className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-700">{item.name}</span>
                          {item.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                      ))}
                    {checklist.filter(item => item.status === 'missing').length > 3 && (
                      <p className="text-xs text-yellow-600">
                        +{checklist.filter(item => item.status === 'missing').length - 3} more documents needed
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadDocuments}
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Refresh Documents
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    // Scroll to document upload section
                    const uploadSection = document.getElementById('document-upload');
                    uploadSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Missing Documents
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
