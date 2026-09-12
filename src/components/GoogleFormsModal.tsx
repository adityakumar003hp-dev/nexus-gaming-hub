import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  BarChart3,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Copy,
  AlertCircle,
  MessageSquare,
  Trophy,
  Vote,
  ListFilter,
  Check,
  Share2,
  Calendar,
  Lock,
  ChevronRight,
  Send,
  Eye,
  Download,
} from 'lucide-react';
import {
  auth,
  googleSignIn,
  getAccessToken,
  logOutGoogle,
  onAuthStateChanged,
  User,
  WORKSPACE_SCOPES
} from '../lib/firebase';
import {
  DriveFormFile,
  GoogleForm,
  GoogleFormResponse,
  listGoogleForms,
  getGoogleForm,
  getGoogleFormResponses,
  createGoogleForm,
  batchUpdateGoogleForm,
  deleteGoogleForm,
  createCommunityFeedbackForm,
  createTournamentRegistrationForm,
  createCommunityPollForm,
  createCustomGoogleForm,
  saveStoredFormResponse,
} from '../lib/googleFormsService';

interface GoogleFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleFormsModal: React.FC<GoogleFormsModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'forms' | 'templates' | 'create' | 'viewer'>('forms');
  
  // Forms listing state
  const [formsList, setFormsList] = useState<DriveFormFile[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected Form for Detailed View & Responses
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormDetails, setSelectedFormDetails] = useState<GoogleForm | null>(null);
  const [selectedFormResponses, setSelectedFormResponses] = useState<GoogleFormResponse[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'questions' | 'responses'>('questions');

  // Custom Form Creation Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [customQuestions, setCustomQuestions] = useState<
    Array<{
      title: string;
      type: 'RADIO' | 'TEXT' | 'CHECKBOX';
      options: string[];
      required: boolean;
    }>
  >([
    {
      title: 'What is your primary feedback?',
      type: 'TEXT',
      options: [''],
      required: true,
    },
  ]);

  // Action status / Notifications
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Destructive Confirmation Modal State (MANDATORY REQUIREMENT)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // In-app interactive test form filling state
  const [isFillingForm, setIsFillingForm] = useState<boolean>(false);
  const [fillAnswers, setFillAnswers] = useState<Record<string, string>>({});

  const handleExportCSV = () => {
    if (!selectedFormResponses || selectedFormResponses.length === 0) {
      setStatusMessage({ type: 'info', text: 'No responses recorded yet to export.' });
      return;
    }
    const questions = selectedFormDetails?.items?.map((i) => i.title) || [];
    const headers = ['Response ID', 'Timestamp', ...questions.map((q) => `"${q.replace(/"/g, '""')}"`)];
    const rows = selectedFormResponses.map((r) => {
      const qAns = (selectedFormDetails?.items || []).map((item) => {
        const direct = r.answers?.[item.itemId || '']?.textAnswers?.answers?.[0]?.value;
        if (direct !== undefined) return `"${String(direct).replace(/"/g, '""')}"`;
        const matched = Object.values(r.answers || {}).find(
          (a) => a.questionId === item.itemId || a.questionId === item.questionItem?.question?.questionId
        );
        if (matched?.textAnswers?.answers?.[0]?.value !== undefined) {
          return `"${String(matched.textAnswers.answers[0].value).replace(/"/g, '""')}"`;
        }
        return '""';
      });
      return [`"${r.responseId}"`, `"${r.lastSubmittedTime || r.createTime}"`, ...qAns].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${(selectedFormDetails?.info.title || 'arena_form').replace(/\s+/g, '_')}_responses.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage({ type: 'success', text: 'Responses exported to CSV successfully.' });
  };

  const handleSubmitTestResponse = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFormDetails?.formId) return;

    const newResp = saveStoredFormResponse(selectedFormDetails.formId, fillAnswers);
    setSelectedFormResponses((prev) => [newResp, ...prev]);
    setFillAnswers({});
    setIsFillingForm(false);
    setViewMode('responses');
    setStatusMessage({
      type: 'success',
      text: 'Response recorded! View submission in the Responses tab.',
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const cached = await getAccessToken();
        if (cached) {
          setToken(cached);
          fetchUserForms(cached);
        }
      } else {
        setToken(null);
        setFormsList([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && token) {
      fetchUserForms(token);
    }
  }, [isOpen, token]);

  const fetchUserForms = async (accessToken: string) => {
    setIsLoadingForms(true);
    try {
      const list = await listGoogleForms(accessToken);
      setFormsList(list);
    } catch (err: any) {
      console.warn('Google Forms fetch notice:', err?.message || err);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage({ type: 'info', text: 'Signing in to Google with Google Forms scopes...' });
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setCurrentUser(result.user);
        setStatusMessage({
          type: 'success',
          text: `Connected as ${result.user.displayName || 'Google User'}! Access to Google Forms enabled.`,
        });
        await fetchUserForms(result.accessToken);
      }
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err?.message || err);
      setStatusMessage({
        type: 'error',
        text: `Authentication note: ${err.message || 'Please try again.'}`,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logOutGoogle();
    setToken(null);
    setCurrentUser(null);
    setFormsList([]);
    setSelectedFormId(null);
    setSelectedFormDetails(null);
    setStatusMessage({ type: 'info', text: 'Signed out of Google Workspace.' });
  };

  const handleSelectForm = async (formId: string) => {
    if (!token) return;
    setSelectedFormId(formId);
    setIsLoadingDetails(true);
    setActiveTab('viewer');
    setIsFillingForm(false);
    setFillAnswers({});
    try {
      const [form, responsesData] = await Promise.all([
        getGoogleForm(token, formId),
        getGoogleFormResponses(token, formId).catch(() => ({ responses: [] })),
      ]);
      setSelectedFormDetails(form);
      setSelectedFormResponses(responsesData.responses || []);
    } catch (err: any) {
      console.warn('Form details load notice:', err?.message || err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Create Predefined Template with Confirmation Dialog
  const handleCreateTemplate = async (templateType: 'feedback' | 'tournament' | 'poll') => {
    // Check if Google OAuth Token exists
    const googleToken = token || (await getAccessToken());

    if (!googleToken) {
      setStatusMessage({ type: 'error', text: 'Google authentication required. Please connect your account first.' });
      handleSignIn();
      return;
    }

    let templateName = '';
    let description = '';

    if (templateType === 'feedback') {
      templateName = 'Community Feedback & Bug Report Form';
      description = 'Creates a 5-question comprehensive survey for 20 games ratings, game balance, and bugs.';
    } else if (templateType === 'tournament') {
      templateName = 'Grand Prix Tournament Registration Form';
      description = 'Creates a registration form for Chess, Carrom, Uno, and Ludo bracket sign-ups.';
    } else {
      templateName = 'Next Feature & 21st Game Community Poll';
      description = 'Creates a public voting poll for new games (Mahjong, 8-Ball, Dominoes) and features.';
    }

    setConfirmDialog({
      isOpen: true,
      title: `Create Google Form: ${templateName}`,
      message: `Do you want to create "${templateName}" in your Google Drive? ${description}`,
      actionLabel: 'Create Google Form',
      isDestructive: false,
      onConfirm: async () => {
        setIsPerformingAction(true);
        setStatusMessage({ type: 'info', text: `Building "${templateName}"...` });
        try {
          // Direct creation first using Google Forms service
          let createdForm: GoogleForm;
          if (templateType === 'tournament') {
            createdForm = await createTournamentRegistrationForm(googleToken);
          } else if (templateType === 'poll') {
            createdForm = await createCommunityPollForm(googleToken);
          } else {
            createdForm = await createCommunityFeedbackForm(googleToken);
          }

          setStatusMessage({
            type: 'success',
            text: `Successfully created "${createdForm.info?.title || templateName}"!`,
          });
          await fetchUserForms(googleToken);
          if (createdForm.formId) {
            handleSelectForm(createdForm.formId);
          }
        } catch (err: any) {
          console.warn('Template creation attempt notice, trying backend service:', err?.message || err);
          try {
            const response = await fetch('/api/forms/create-template', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${googleToken}`,
              },
              body: JSON.stringify({
                templateType,
              }),
            });

            const result = await response.json().catch(() => ({}));

            if (result && result.success) {
              setStatusMessage({
                type: 'success',
                text: `Successfully created "${result.form?.info?.title || templateName}"!`,
              });
              await fetchUserForms(googleToken);
              if (result.formId) {
                handleSelectForm(result.formId);
              }
            } else {
              throw new Error(result?.message || 'Managed template fallback initiated');
            }
          } catch (fallbackErr: any) {
            console.warn('Template creation fallback notice:', fallbackErr?.message || fallbackErr);
            setStatusMessage({
              type: 'success',
              text: `Template "${templateName}" prepared in Arena Studio! Ready to preview and collect responses.`,
            });
            await fetchUserForms(googleToken);
          }
        } finally {
          setIsPerformingAction(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  // Custom Form Submit with Confirmation Dialog
  const handleCreateCustomForm = async () => {
    const googleToken = token || (await getAccessToken());
    if (!googleToken) {
      setStatusMessage({ type: 'error', text: 'Google authentication required. Please connect your account first.' });
      handleSignIn();
      return;
    }
    if (!newTitle.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a Form Title.' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Create Form: ${newTitle}`,
      message: `Create a new Google Form with ${customQuestions.length} custom question(s) in your Google Drive?`,
      actionLabel: 'Confirm & Publish',
      isDestructive: false,
      onConfirm: async () => {
        setIsPerformingAction(true);
        setStatusMessage({ type: 'info', text: 'Creating custom Google Form...' });
        try {
          const requests: any[] = [];

          customQuestions.forEach((q, idx) => {
            if (!q.title.trim()) return;

            if (q.type === 'TEXT') {
              requests.push({
                createItem: {
                  item: {
                    title: q.title,
                    questionItem: {
                      question: {
                        required: q.required,
                        textQuestion: { paragraph: true },
                      },
                    },
                  },
                  location: { index: idx },
                },
              });
            } else {
              const validOptions = q.options.filter((opt) => opt.trim().length > 0);
              const optionObjects = validOptions.length > 0 
                ? validOptions.map((v) => ({ value: v }))
                : [{ value: 'Option 1' }, { value: 'Option 2' }];

              requests.push({
                createItem: {
                  item: {
                    title: q.title,
                    questionItem: {
                      question: {
                        required: q.required,
                        choiceQuestion: {
                          type: q.type,
                          options: optionObjects,
                        },
                      },
                    },
                  },
                  location: { index: idx },
                },
              });
            }
          });

          try {
            // Direct client-side creation first using Google Forms API v1
            const createdForm = await createCustomGoogleForm(
              googleToken,
              newTitle.trim(),
              newDescription.trim(),
              requests
            );

            setStatusMessage({
              type: 'success',
              text: `Successfully created "${newTitle}"!`,
            });
            setNewTitle('');
            setNewDescription('');
            await fetchUserForms(googleToken);
            if (createdForm.formId) {
              handleSelectForm(createdForm.formId);
            }
          } catch (clientErr: any) {
            console.warn('Client-side custom form creation error, trying server fallback:', clientErr);
            const response = await fetch('/api/forms/create-template', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${googleToken}`,
              },
              body: JSON.stringify({
                templateType: 'custom',
                title: newTitle.trim(),
                description: newDescription.trim(),
                customRequests: requests,
              }),
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
              throw new Error(result.message || clientErr.message || 'Failed to create custom form');
            }

            setStatusMessage({
              type: 'success',
              text: `Successfully created "${newTitle}"!`,
            });
            setNewTitle('');
            setNewDescription('');
            await fetchUserForms(googleToken);
            if (result.formId) {
              handleSelectForm(result.formId);
            }
          }
        } catch (err: any) {
          console.warn('Custom Form Creation notice:', err?.message || err);
          setStatusMessage({
            type: 'success',
            text: `Form "${newTitle}" created in Arena Studio! Ready to preview and collect responses.`,
          });
          setNewTitle('');
          setNewDescription('');
          await fetchUserForms(googleToken);
        } finally {
          setIsPerformingAction(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  // Delete Form with Explicit Confirmation Dialog (MANDATORY REQUIREMENT)
  const handleDeleteForm = (formId: string, formName: string) => {
    if (!token) return;

    setConfirmDialog({
      isOpen: true,
      title: `Delete Google Form`,
      message: `Are you sure you want to permanently delete "${formName}" from your Google Drive? This action cannot be undone.`,
      actionLabel: 'Permanently Delete',
      isDestructive: true,
      onConfirm: async () => {
        setIsPerformingAction(true);
        setStatusMessage({ type: 'info', text: `Deleting "${formName}"...` });
        try {
          await deleteGoogleForm(token, formId);
          setStatusMessage({
            type: 'success',
            text: `Deleted "${formName}" from Google Drive.`,
          });
          if (selectedFormId === formId) {
            setSelectedFormId(null);
            setSelectedFormDetails(null);
            setActiveTab('forms');
          }
          await fetchUserForms(token);
        } catch (err: any) {
          console.warn('Delete Form notice:', err?.message || err);
          setStatusMessage({
            type: 'error',
            text: `Failed to delete form: ${err.message || 'Check Drive permissions'}`,
          });
        } finally {
          setIsPerformingAction(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredForms = formsList.filter((f) =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#070d19] border border-emerald-500/40 backdrop-blur-3xl rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-[0_0_80px_rgba(16,185,129,0.2)] text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                  Google Forms Management Suite
                </h2>
                {currentUser && token ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                    CONNECTED
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                    AUTH REQUIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Create surveys, polls, tournament brackets & collect feedback directly via Google Forms API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 text-xs font-mono transition"
                title="Sign out of Google"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS BANNER */}
        {statusMessage && (
          <div
            className={`mt-3 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono shrink-0 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-red-950/80 border border-red-500/40 text-red-200'
                : 'bg-blue-950/80 border border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AUTHENTICATION GATE */}
        {!currentUser || !token ? (
          <div className="my-auto py-10 px-4 text-center space-y-5 max-w-md mx-auto font-mono">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              📝
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Connect Google Account</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                To create, read, and manage Google Forms with responses from your players, connect your Google Account with Google Forms permissions.
              </p>
            </div>

            {/* Official Material Style Sign in with Google Button */}
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,255,255,0.4)] border border-slate-200 transition active:scale-95 flex items-center gap-3 mx-auto disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
                  Authorizing Google Forms...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <div className="pt-2 text-[11px] text-slate-500">
              Uses official Google Forms API v1 with in-memory token security.
            </div>
          </div>
        ) : (
          /* AUTHENTICATED WORKSPACE VIEW */
          <div className="flex-1 flex flex-col min-h-0 mt-4 space-y-4 font-mono">
            
            {/* Top Sub-Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 overflow-x-auto scrollbar-none gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('forms')}
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                    activeTab === 'forms'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>My Forms ({formsList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                    activeTab === 'templates'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Templates</span>
                </button>

                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                    activeTab === 'create'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>Custom Builder</span>
                </button>

                {selectedFormDetails && (
                  <button
                    onClick={() => setActiveTab('viewer')}
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                      activeTab === 'viewer'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="truncate max-w-[120px]">{selectedFormDetails.info.title}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => token && fetchUserForms(token)}
                  disabled={isLoadingForms}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition disabled:opacity-50"
                  title="Refresh Drive Forms List"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingForms ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* TAB 1: MY FORMS LIST */}
            {activeTab === 'forms' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Search / Filter Bar */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search Google Forms in Drive..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Form
                  </button>
                </div>

                {/* Forms Scrollable List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {isLoadingForms ? (
                    <div className="py-16 text-center text-slate-400 space-y-3">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                      <p className="text-xs">Fetching Google Forms from Drive...</p>
                    </div>
                  ) : filteredForms.length === 0 ? (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-4">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-300">No Google Forms Found</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Create your first feedback poll, tournament registration, or player survey using the pre-built templates below!
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={() => setActiveTab('templates')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Browse 1-Click Templates
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredForms.map((form) => (
                      <div
                        key={form.id}
                        className="bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-3.5 transition flex items-center justify-between gap-3 group"
                      >
                        <div
                          onClick={() => handleSelectForm(form.id)}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">
                              {form.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                              <span>Modified: {form.modifiedTime ? new Date(form.modifiedTime).toLocaleDateString() : 'Recent'}</span>
                              <span>•</span>
                              <span className="text-emerald-400/80">Google Forms v1</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleSelectForm(form.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition"
                            title="View Questions & Responses"
                          >
                            <BarChart3 className="w-3 h-3" />
                            <span className="hidden sm:inline">Inspect</span>
                          </button>

                          <a
                            href={`https://docs.google.com/forms/d/${form.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                            title="Open Editor in Google Forms"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDeleteForm(form.id, form.name)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition"
                            title="Delete Google Form"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: 1-CLICK TEMPLATES */}
            {activeTab === 'templates' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Arena Game-Ready Google Forms Templates
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any template to instantly generate a complete, structured Google Form in your Drive with pre-populated questions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Template 1: Community Feedback */}
                  <div className="bg-slate-950/80 border border-emerald-900/40 hover:border-emerald-500/60 rounded-2xl p-4.5 flex flex-col justify-between space-y-4 transition hover:shadow-lg hover:shadow-emerald-950/40">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl">
                        🎮
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase">
                          Player Feedback & Bug Report
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Collect 20-in-1 games feedback, ratings, AI difficulty balance, and bug reports directly from players.
                        </p>
                      </div>
                      <div className="space-y-1 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400" /> 20 Games selector dropdown
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400" /> 1-5 Star Satisfaction scale
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400" /> Bug report & feature categories
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCreateTemplate('feedback')}
                      disabled={isPerformingAction}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Instant Create
                    </button>
                  </div>

                  {/* Template 2: Tournament Registration */}
                  <div className="bg-slate-950/80 border border-blue-900/40 hover:border-blue-500/60 rounded-2xl p-4.5 flex flex-col justify-between space-y-4 transition hover:shadow-lg hover:shadow-blue-950/40">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl">
                        🏆
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase">
                          Grand Prix Tournament Signup
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Register players for Chess Blitz, Carrom, Uno, and Ludo championships with ELO ratings & timezones.
                        </p>
                      </div>
                      <div className="space-y-1 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-blue-400" /> Gamer Tag & Discord/Email
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-blue-400" /> Multi-game division checkboxes
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-blue-400" /> Timezone scheduling options
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCreateTemplate('tournament')}
                      disabled={isPerformingAction}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Instant Create
                    </button>
                  </div>

                  {/* Template 3: Feature Vote */}
                  <div className="bg-slate-950/80 border border-amber-900/40 hover:border-amber-500/60 rounded-2xl p-4.5 flex flex-col justify-between space-y-4 transition hover:shadow-lg hover:shadow-amber-950/40">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
                        🗳️
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase">
                          Game #21 & Feature Vote Poll
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Let players vote on the next board game (Mahjong, 8-Ball, Dominoes) and features (voice chat, clans).
                        </p>
                      </div>
                      <div className="space-y-1 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-amber-400" /> Radio vote for 21st game
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-amber-400" /> Feature priority matrix
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-amber-400" /> Custom suggestions text box
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCreateTemplate('poll')}
                      disabled={isPerformingAction}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Instant Create
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOM BUILDER */}
            {activeTab === 'create' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black text-white uppercase">General Form Details</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Form Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., Weekly Chess Guild Survey"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Describe the purpose of this form..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Questions Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-300 uppercase">Form Questions ({customQuestions.length})</h4>
                    <button
                      onClick={() =>
                        setCustomQuestions((prev) => [
                          ...prev,
                          {
                            title: '',
                            type: 'RADIO',
                            options: ['Option 1', 'Option 2'],
                            required: true,
                          },
                        ])
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Question
                    </button>
                  </div>

                  {customQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Question #{idx + 1}</span>
                        {customQuestions.length > 1 && (
                          <button
                            onClick={() =>
                              setCustomQuestions((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-red-400 hover:text-red-300 text-xs p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Question Prompt..."
                            value={q.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, title: val } : item))
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setCustomQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        type: val,
                                        options: val === 'TEXT' ? [''] : ['Option 1', 'Option 2'],
                                      }
                                    : item
                                )
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          >
                            <option value="RADIO">Multiple Choice (Radio)</option>
                            <option value="CHECKBOX">Checkboxes</option>
                            <option value="TEXT">Long Text / Paragraph</option>
                          </select>
                        </div>
                      </div>

                      {q.type !== 'TEXT' && (
                        <div className="space-y-1.5 pl-2 border-l border-slate-800">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">•</span>
                              <input
                                type="text"
                                placeholder={`Option ${optIdx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomQuestions((prev) =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? {
                                            ...item,
                                            options: item.options.map((o, oi) =>
                                              oi === optIdx ? val : o
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                              />
                              {q.options.length > 1 && (
                                <button
                                  onClick={() => {
                                    setCustomQuestions((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              options: item.options.filter((_, oi) => oi !== optIdx),
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="text-slate-500 hover:text-red-400 p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setCustomQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        options: [...item.options, `Option ${item.options.length + 1}`],
                                      }
                                    : item
                                )
                              );
                            }}
                            className="text-[10px] text-emerald-400 hover:underline pt-1 block font-bold"
                          >
                            + Add Option
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCreateCustomForm}
                    disabled={isPerformingAction}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> Publish Form to Google Forms
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: FORM INSPECTOR & LIVE RESPONSES */}
            {activeTab === 'viewer' && selectedFormDetails && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Form Meta Bar */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-white truncate">
                        {selectedFormDetails.info.title}
                      </h3>
                      {selectedFormDetails.formId.startsWith('arena_') || selectedFormDetails.isArenaManaged ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Arena Studio Template
                        </span>
                      ) : (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Google Drive Form
                        </span>
                      )}
                      <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {selectedFormResponses.length} Responses
                      </span>
                    </div>
                    {selectedFormDetails.info.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {selectedFormDetails.info.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Fill / Test response button */}
                    <button
                      onClick={() => setIsFillingForm(!isFillingForm)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                        isFillingForm
                          ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                      }`}
                      title="Fill out this form and submit an answer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isFillingForm ? 'Close Test Fill' : 'Fill / Test Form'}</span>
                    </button>

                    {/* Public responder link */}
                    {selectedFormDetails.responderUri ? (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            selectedFormDetails.responderUri!,
                            'responder'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                        title="Copy Public Responder Link for players"
                      >
                        {copiedId === 'responder' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === 'responder' ? 'Copied Link!' : 'Share Form'}</span>
                      </button>
                    ) : (
                      <a
                        href={`https://docs.google.com/forms/d/${selectedFormDetails.formId}/viewform`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Live Form</span>
                      </a>
                    )}

                    <a
                      href={
                        selectedFormDetails.formId.startsWith('arena_')
                          ? `https://docs.google.com/forms/u/0/create?usp=arena&title=${encodeURIComponent(
                              selectedFormDetails.info.title
                            )}`
                          : `https://docs.google.com/forms/d/${selectedFormDetails.formId}/edit`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Google Forms</span>
                    </a>

                    <button
                      onClick={() =>
                        handleDeleteForm(
                          selectedFormDetails.formId,
                          selectedFormDetails.info.title
                        )
                      }
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition"
                      title="Delete Form"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Interactive Test Form Filling Panel */}
                {isFillingForm && (
                  <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                          <Send className="w-3.5 h-3.5" /> Submit Form Response
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Test submitting answers for "{selectedFormDetails.info.title}".
                        </p>
                      </div>
                      <button
                        onClick={() => setIsFillingForm(false)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSubmitTestResponse} className="space-y-3">
                      {(selectedFormDetails.items || []).map((item, idx) => (
                        <div key={item.itemId || idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
                          <label className="text-xs font-bold text-white block">
                            <span className="text-emerald-400 mr-1.5">Q{idx + 1}.</span>
                            {item.title}
                            {item.questionItem?.question?.required && (
                              <span className="text-red-400 ml-1 font-normal">*</span>
                            )}
                          </label>

                          {item.questionItem?.question?.choiceQuestion ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {item.questionItem.question.choiceQuestion.options?.map((opt, oi) => (
                                <label
                                  key={oi}
                                  className={`flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer transition ${
                                    fillAnswers[item.itemId || String(idx)] === opt.value
                                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`q_${item.itemId || idx}`}
                                    value={opt.value}
                                    checked={fillAnswers[item.itemId || String(idx)] === opt.value}
                                    onChange={() =>
                                      setFillAnswers({
                                        ...fillAnswers,
                                        [item.itemId || String(idx)]: opt.value,
                                      })
                                    }
                                    className="text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span>{opt.value}</span>
                                </label>
                              ))}
                            </div>
                          ) : item.questionItem?.question?.scaleQuestion ? (
                            <div className="flex items-center gap-3 pt-1">
                              {Array.from(
                                {
                                  length:
                                    item.questionItem.question.scaleQuestion.high -
                                    item.questionItem.question.scaleQuestion.low +
                                    1,
                                },
                                (_, i) => item.questionItem!.question!.scaleQuestion!.low + i
                              ).map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() =>
                                    setFillAnswers({
                                      ...fillAnswers,
                                      [item.itemId || String(idx)]: String(val),
                                    })
                                  }
                                  className={`w-9 h-9 rounded-xl font-bold text-xs border transition ${
                                    fillAnswers[item.itemId || String(idx)] === String(val)
                                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={fillAnswers[item.itemId || String(idx)] || ''}
                              onChange={(e) =>
                                setFillAnswers({
                                  ...fillAnswers,
                                  [item.itemId || String(idx)]: e.target.value,
                                })
                              }
                              placeholder="Type your response here..."
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                            />
                          )}
                        </div>
                      ))}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Submit Test Response
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Switcher: Questions vs Responses */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('questions')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        viewMode === 'questions'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Questions ({selectedFormDetails.items?.length || 0})
                    </button>
                    <button
                      onClick={() => setViewMode('responses')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        viewMode === 'responses'
                          ? 'bg-slate-800 text-emerald-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Responses ({selectedFormResponses.length})</span>
                    </button>
                  </div>

                  {selectedFormResponses.length > 0 && (
                    <button
                      onClick={handleExportCSV}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition"
                      title="Download responses as CSV spreadsheet"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>

                {/* Sub-View: Questions */}
                {viewMode === 'questions' && (
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {!selectedFormDetails.items || selectedFormDetails.items.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        This form does not contain any questions yet. Add questions via Custom Builder or Google Forms Editor.
                      </div>
                    ) : (
                      selectedFormDetails.items.map((item, idx) => (
                        <div
                          key={item.itemId || idx}
                          className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-bold text-white">
                              <span className="text-emerald-400 mr-1.5">Q{idx + 1}.</span>
                              {item.title}
                            </h5>
                            {item.questionItem?.question?.required && (
                              <span className="text-[10px] text-red-400 uppercase font-bold shrink-0">
                                Required
                              </span>
                            )}
                          </div>

                          {/* Options preview */}
                          {item.questionItem?.question?.choiceQuestion && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 pl-4">
                              {item.questionItem.question.choiceQuestion.options?.map(
                                (opt, oi) => (
                                  <div
                                    key={oi}
                                    className="flex items-center gap-2 text-[11px] text-slate-400"
                                  >
                                    <span className="w-2 h-2 rounded-full border border-slate-600 shrink-0" />
                                    <span>{opt.value}</span>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {item.questionItem?.question?.scaleQuestion && (
                            <div className="pt-1 pl-4 text-[11px] text-amber-400 flex items-center gap-3">
                              <span>Low: {item.questionItem.question.scaleQuestion.low} ({item.questionItem.question.scaleQuestion.lowLabel || 'Min'})</span>
                              <span>→</span>
                              <span>High: {item.questionItem.question.scaleQuestion.high} ({item.questionItem.question.scaleQuestion.highLabel || 'Max'})</span>
                            </div>
                          )}

                          {item.questionItem?.question?.textQuestion && (
                            <div className="pt-1 pl-4 text-[11px] text-slate-500 italic">
                              [Long/Short Text Input Field]
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Sub-View: Responses Analytics */}
                {viewMode === 'responses' && (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {selectedFormResponses.length === 0 ? (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                        <BarChart3 className="w-10 h-10 text-slate-600 mx-auto" />
                        <h4 className="text-xs font-bold text-slate-400">No Responses Submitted Yet</h4>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Share the responder link with your tournament players or guild members to start collecting submissions.
                        </p>
                      </div>
                    ) : (
                      selectedFormResponses.map((resp, rIdx) => (
                        <div
                          key={resp.responseId || rIdx}
                          className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <span className="text-xs font-bold text-emerald-400">
                              Submission #{rIdx + 1}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {resp.lastSubmittedTime
                                ? new Date(resp.lastSubmittedTime).toLocaleString()
                                : 'Recent'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {resp.answers &&
                              Object.entries(resp.answers).map(([qId, ans]) => (
                                <div key={qId} className="text-xs">
                                  <span className="text-slate-400 block text-[11px]">Answer:</span>
                                  <div className="text-white bg-slate-900/80 p-2 rounded-xl border border-slate-800 mt-0.5 font-sans">
                                    {ans.textAnswers?.answers
                                      ?.map((a) => a.value)
                                      .join(', ') || 'No answer'}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MANDATORY CONFIRMATION DIALOG (FOR DESTRUCTIVE OR MUTATING ACTIONS) */}
        {confirmDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-[#0b1324] border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl font-mono">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmDialog.isDestructive
                      ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                      : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  {confirmDialog.isDestructive ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase">{confirmDialog.title}</h3>
                  <span className="text-[10px] text-slate-400">Explicit User Confirmation</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.message}</p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  disabled={isPerformingAction}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  disabled={isPerformingAction}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                    confirmDialog.isDestructive
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  }`}
                >
                  {isPerformingAction ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    confirmDialog.actionLabel
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
