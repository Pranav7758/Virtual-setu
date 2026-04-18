import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, AlertCircle, ShieldCheck, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentVerification } from '@/hooks/useDocumentVerification';

interface DocumentUploadProps {
  onUploadComplete: () => void;
}

const DOCUMENT_CATEGORIES = [
  {
    group: 'Identity',
    types: [
      { value: 'aadhaar', label: 'Aadhaar Card' },
      { value: 'pan_card', label: 'PAN Card' },
      { value: 'voter_id', label: 'Voter ID / EPIC Card' },
      { value: 'passport', label: 'Passport' },
      { value: 'driving_license', label: 'Driving License' },
      { value: 'ration_card', label: 'Ration Card' },
      { value: 'npr_card', label: 'NPR Card (National Population Register)' },
      { value: 'senior_citizen_card', label: 'Senior Citizen Card' },
      { value: 'disability_certificate', label: 'Disability Certificate' },
      { value: 'arms_license', label: 'Arms License' },
    ],
  },
  {
    group: 'Birth & Family',
    types: [
      { value: 'birth_certificate', label: 'Birth Certificate' },
      { value: 'death_certificate', label: 'Death Certificate' },
      { value: 'marriage_certificate', label: 'Marriage Certificate' },
      { value: 'divorce_certificate', label: 'Divorce Certificate' },
      { value: 'adoption_certificate', label: 'Adoption Certificate' },
      { value: 'legal_heir_certificate', label: 'Legal Heir Certificate' },
      { value: 'family_certificate', label: 'Family Certificate' },
    ],
  },
  {
    group: 'Education',
    types: [
      { value: 'class_10_marksheet', label: 'Class 10 Marksheet' },
      { value: 'class_12_marksheet', label: 'Class 12 Marksheet' },
      { value: 'graduation_certificate', label: 'Graduation / Degree Certificate' },
      { value: 'postgrad_certificate', label: 'Post-Graduation Certificate' },
      { value: 'diploma_certificate', label: 'Diploma Certificate' },
      { value: 'transfer_certificate', label: 'Transfer Certificate (TC)' },
      { value: 'migration_certificate', label: 'Migration Certificate' },
      { value: 'bonafide_certificate', label: 'Bonafide Certificate' },
      { value: 'character_certificate', label: 'Character Certificate' },
      { value: 'scholarship_certificate', label: 'Scholarship Certificate' },
      { value: 'provisional_certificate', label: 'Provisional Certificate' },
    ],
  },
  {
    group: 'Income & Finance',
    types: [
      { value: 'income_certificate', label: 'Income Certificate' },
      { value: 'salary_slip', label: 'Salary Slip' },
      { value: 'form_16', label: 'Form 16 (TDS Certificate)' },
      { value: 'itr', label: 'Income Tax Return (ITR)' },
      { value: 'bank_statement', label: 'Bank Statement' },
      { value: 'passbook', label: 'Bank Passbook' },
      { value: 'cancelled_cheque', label: 'Cancelled Cheque' },
      { value: 'gst_certificate', label: 'GST Registration Certificate' },
      { value: 'pan_business', label: 'Business PAN Card' },
      { value: 'udyam_certificate', label: 'Udyam Registration Certificate (MSME)' },
    ],
  },
  {
    group: 'Property & Land',
    types: [
      { value: 'property_deed', label: 'Property / Sale Deed' },
      { value: 'land_record', label: 'Land Record / Khasra / Khatauni' },
      { value: 'encumbrance_certificate', label: 'Encumbrance Certificate' },
      { value: 'property_tax_receipt', label: 'Property Tax Receipt' },
      { value: 'rental_agreement', label: 'Rental / Lease Agreement' },
      { value: 'noc_property', label: 'NOC from Society / Landlord' },
      { value: 'electricity_bill', label: 'Electricity Bill' },
      { value: 'water_bill', label: 'Water Bill' },
      { value: 'gas_connection', label: 'Gas Connection Document' },
    ],
  },
  {
    group: 'Category / Community',
    types: [
      { value: 'caste_certificate', label: 'Caste Certificate' },
      { value: 'domicile_certificate', label: 'Domicile Certificate' },
      { value: 'obc_certificate', label: 'OBC Certificate' },
      { value: 'sc_st_certificate', label: 'SC / ST Certificate' },
      { value: 'ews_certificate', label: 'EWS Certificate' },
      { value: 'minority_certificate', label: 'Minority Certificate' },
      { value: 'nationality_certificate', label: 'Nationality Certificate' },
    ],
  },
  {
    group: 'Employment',
    types: [
      { value: 'employment_certificate', label: 'Employment / Experience Certificate' },
      { value: 'relieving_letter', label: 'Relieving Letter' },
      { value: 'offer_letter', label: 'Offer Letter' },
      { value: 'appointment_letter', label: 'Appointment Letter' },
      { value: 'service_certificate', label: 'Service Certificate (Government)' },
      { value: 'police_clearance', label: 'Police Clearance Certificate' },
      { value: 'noc_employer', label: 'NOC from Employer' },
    ],
  },
  {
    group: 'Health & Medical',
    types: [
      { value: 'medical_certificate', label: 'Medical / Fitness Certificate' },
      { value: 'vaccination_certificate', label: 'Vaccination Certificate' },
      { value: 'covid_certificate', label: 'COVID-19 Vaccination Certificate' },
      { value: 'health_card', label: 'Health / Ayushman Bharat Card' },
      { value: 'blood_group_report', label: 'Blood Group Report' },
      { value: 'insurance_policy', label: 'Insurance Policy Document' },
    ],
  },
  {
    group: 'Vehicle',
    types: [
      { value: 'vehicle_rc', label: 'Vehicle Registration Certificate (RC)' },
      { value: 'vehicle_insurance', label: 'Vehicle Insurance' },
      { value: 'puc_certificate', label: 'PUC Certificate' },
      { value: 'vehicle_fitness', label: 'Vehicle Fitness Certificate' },
    ],
  },
  {
    group: 'Legal & Miscellaneous',
    types: [
      { value: 'affidavit', label: 'Affidavit' },
      { value: 'power_of_attorney', label: 'Power of Attorney' },
      { value: 'gazette_notification', label: 'Gazette Notification (Name Change)' },
      { value: 'noc_police', label: 'NOC from Police' },
      { value: 'court_order', label: 'Court Order / Judgement' },
      { value: 'other', label: 'Other' },
    ],
  },
];

const ALL_TYPES = DOCUMENT_CATEGORIES.flatMap((c) => c.types);

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const { user } = useAuth();
  const { verify, state: verifyState, result: verifyResult, reset: resetVerify } = useDocumentVerification();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [typeOpen, setTypeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTypeLabel = ALL_TYPES.find((t) => t.value === documentType)?.label ?? '';

  const resetForm = () => {
    setSelectedFile(null);
    setDocumentType('');
    setDocumentName('');
    setUploadProgress(0);
    resetVerify();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only JPG, PNG, or PDF files');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    resetVerify();
    if (!documentName) setDocumentName(file.name.split('.')[0]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const fakeEvent = {
      target: { files: [file] as unknown as FileList },
    } as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(fakeEvent);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setDocumentName('');
    resetVerify();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVerifyAndUpload = async () => {
    if (!selectedFile || !documentType || !documentName.trim() || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.info('AI is verifying your document…');
    const result = await verify(selectedFile, documentType);

    if (!result) {
      toast.error('Verification could not be completed. Please try again.');
      return;
    }

    if (!result.isValid) {
      toast.error(result.message);
      return;
    }

    setUploading(true);
    setUploadProgress(30);

    try {
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/${timestamp}_${documentName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_name: documentName.trim(),
          file_url: filePath,
          verification_status: 'verified',
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast.success('Document verified and uploaded successfully!');
      resetForm();
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isVerifying = verifyState === 'verifying';
  const isBusy = isVerifying || uploading;

  return (
    <Card className="card-3d border-0">
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Documents are AI-verified before upload. Accepted formats: JPG, PNG, PDF (max 5MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Drop Zone */}
        <div
          className="border-2 border-dashed border-border/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/30 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isBusy && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
          />

          {selectedFile ? (
            <div className="flex items-center justify-center space-x-3">
              <FileText className="h-12 w-12 text-primary" />
              <div className="text-left">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">JPG, PNG or PDF up to 5MB</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Verification Status Banner */}
        {verifyState !== 'idle' && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
              verifyState === 'verifying'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : verifyState === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {verifyState === 'verifying' && (
              <Loader2 className="h-5 w-5 mt-0.5 animate-spin flex-shrink-0" />
            )}
            {verifyState === 'success' && (
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            {verifyState === 'error' && (
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {verifyState === 'verifying' && 'AI is analysing your document…'}
                {verifyState === 'success' && `Verified — ${verifyResult?.detectedType}`}
                {verifyState === 'error' && 'Verification Failed'}
              </p>
              {verifyResult?.message && (
                <p className="text-sm opacity-80 mt-0.5">{verifyResult.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading…</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Searchable Document Type */}
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type *</Label>
            <Popover open={typeOpen} onOpenChange={setTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="document-type"
                  variant="outline"
                  role="combobox"
                  aria-expanded={typeOpen}
                  disabled={isBusy}
                  className="w-full justify-between font-normal"
                >
                  <span className={cn(!selectedTypeLabel && 'text-muted-foreground')}>
                    {selectedTypeLabel || 'Search document type…'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search any document type…" />
                  <CommandList className="max-h-72">
                    <CommandEmpty>No document type found.</CommandEmpty>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <CommandGroup key={category.group} heading={category.group}>
                        {category.types.map((type) => (
                          <CommandItem
                            key={type.value}
                            value={type.label}
                            onSelect={() => {
                              setDocumentType(type.value);
                              resetVerify();
                              setTypeOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4 flex-shrink-0',
                                documentType === type.value ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {type.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-name">Document Name *</Label>
            <Input
              id="document-name"
              placeholder="Enter document name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              disabled={isBusy}
            />
          </div>
        </div>

        {/* Primary Action */}
        <Button
          onClick={handleVerifyAndUpload}
          disabled={!selectedFile || !documentType || !documentName.trim() || isBusy || verifyState === 'error'}
          className="w-full bg-gradient-primary glow-primary"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI Verifying Document…
            </>
          ) : uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verify &amp; Upload
            </>
          )}
        </Button>

        {/* Retry after failed verification */}
        {verifyState === 'error' && (
          <Button
            variant="outline"
            onClick={resetVerify}
            className="w-full bg-card-glass/50 backdrop-blur-xl border-border/20"
          >
            Try a Different File
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
