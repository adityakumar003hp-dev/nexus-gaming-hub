// Google Forms & Google Drive API Service
// Integration with Google Forms API v1 and Google Drive API v3

export interface FormItem {
  itemId?: string;
  title: string;
  description?: string;
  questionItem?: {
    question: {
      questionId?: string;
      required?: boolean;
      choiceQuestion?: {
        type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
        options: { value: string }[];
        shuffle?: boolean;
      };
      textQuestion?: {
        paragraph?: boolean;
      };
      scaleQuestion?: {
        low: number;
        high: number;
        lowLabel?: string;
        highLabel?: string;
      };
    };
  };
}

export interface GoogleForm {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  settings?: any;
  items?: FormItem[];
  revisionId?: string;
  responderUri?: string;
  linkedSheetId?: string;
  isArenaManaged?: boolean;
}

export interface GoogleFormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers?: Record<
    string,
    {
      questionId: string;
      textAnswers?: {
        answers: { value: string }[];
      };
    }
  >;
}

export interface DriveFormFile {
  id: string;
  name: string;
  description?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  isArenaManaged?: boolean;
}

const FORM_DATA_PREFIX = 'arena_form_data_';
const FORM_RESPONSES_PREFIX = 'arena_form_responses_';

/**
 * Storage helpers for resilient form and response persistence
 */
export function getStoredFormData(formId: string): GoogleForm | null {
  try {
    const raw = localStorage.getItem(FORM_DATA_PREFIX + formId);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Storage read warning:', e);
  }
  return null;
}

export function saveStoredFormData(formId: string, form: GoogleForm): void {
  try {
    localStorage.setItem(FORM_DATA_PREFIX + formId, JSON.stringify(form));
  } catch (e) {
    console.warn('Storage save warning:', e);
  }
}

export function saveFormToDriveList(
  formId: string,
  title: string,
  description?: string,
  responderUri?: string
): void {
  try {
    const saved = localStorage.getItem('user_created_google_forms');
    const list = saved ? JSON.parse(saved) : [];
    const entry: DriveFormFile = {
      id: formId,
      name: title,
      description: description || '',
      webViewLink: responderUri || `https://docs.google.com/forms/d/${formId}/viewform`,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      isArenaManaged: formId.startsWith('arena_'),
    };
    if (!list.some((f: any) => f.id === formId)) {
      list.unshift(entry);
      localStorage.setItem('user_created_google_forms', JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Drive list cache warning:', e);
  }
}

export function getStoredFormResponses(formId: string): GoogleFormResponse[] {
  try {
    const raw = localStorage.getItem(FORM_RESPONSES_PREFIX + formId);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Responses read warning:', e);
  }
  return [];
}

export function saveStoredFormResponse(
  formId: string,
  answers: Record<string, string>
): GoogleFormResponse {
  const responses = getStoredFormResponses(formId);
  const formattedAnswers: Record<
    string,
    { questionId: string; textAnswers: { answers: { value: string }[] } }
  > = {};

  Object.entries(answers).forEach(([qId, val]) => {
    formattedAnswers[qId] = {
      questionId: qId,
      textAnswers: {
        answers: [{ value: String(val) }],
      },
    };
  });

  const newResp: GoogleFormResponse = {
    responseId: `resp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createTime: new Date().toISOString(),
    lastSubmittedTime: new Date().toISOString(),
    answers: formattedAnswers,
  };

  responses.unshift(newResp);
  try {
    localStorage.setItem(FORM_RESPONSES_PREFIX + formId, JSON.stringify(responses));
  } catch (e) {
    console.warn('Response save warning:', e);
  }
  return newResp;
}

/**
 * Applies structure update requests (items, description) to locally cached forms
 */
function applyRequestsToLocalForm(formId: string, requests: any[]) {
  const existing = getStoredFormData(formId) || {
    formId,
    info: { title: 'Arena Game Form' },
    items: [],
  };

  const newItems = [...(existing.items || [])];

  for (const r of requests) {
    if (r.updateFormInfo?.info?.description) {
      existing.info.description = r.updateFormInfo.info.description;
    }
    if (r.createItem?.item) {
      const idx =
        typeof r.createItem.location?.index === 'number'
          ? r.createItem.location.index
          : newItems.length;
      const itm: FormItem = {
        itemId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: r.createItem.item.title || 'Untitled Question',
        description: r.createItem.item.description,
        questionItem: r.createItem.item.questionItem,
      };
      if (idx >= newItems.length) {
        newItems.push(itm);
      } else {
        newItems.splice(idx, 0, itm);
      }
    }
  }

  existing.items = newItems;
  saveStoredFormData(formId, existing);
}

/**
 * List all Google Forms owned/accessible by the user via Google Drive API v3
 * with seamless merge of local Arena templates
 */
export async function listGoogleForms(accessToken: string): Promise<DriveFormFile[]> {
  const driveFiles: DriveFormFile[] = [];

  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
    const fields = encodeURIComponent('files(id,name,description,createdTime,modifiedTime,webViewLink,iconLink)');
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=50&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.files && Array.isArray(data.files)) {
        driveFiles.push(...data.files);
      }
    }
  } catch (err) {
    console.warn('Google Drive v3 list files notice:', err);
  }

  try {
    const saved = localStorage.getItem('user_created_google_forms');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const item of parsed) {
          if (!driveFiles.some((f) => f.id === item.id)) {
            driveFiles.push(item);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not read cached forms:', e);
  }

  return driveFiles;
}

/**
 * Get form details (structure, questions, title, responderUri) from Google Forms API or resilient local store
 */
export async function getGoogleForm(accessToken: string, formId: string): Promise<GoogleForm> {
  const local = getStoredFormData(formId);
  if (formId.startsWith('arena_') && local) {
    return local;
  }

  try {
    const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      saveStoredFormData(formId, data);
      return data;
    }
  } catch (err) {
    console.warn('Google Forms API load notice, using local definition:', err);
  }

  if (local) return local;

  return {
    formId,
    info: {
      title: 'Arena Form Template',
      description: 'Loaded form structure from local cache.',
    },
    items: [],
  };
}

/**
 * Get all responses for a form from Google Forms API or local response cache
 */
export async function getGoogleFormResponses(
  accessToken: string,
  formId: string
): Promise<{ responses?: GoogleFormResponse[] }> {
  const localResponses = getStoredFormResponses(formId);

  if (formId.startsWith('arena_')) {
    return { responses: localResponses };
  }

  try {
    const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const googleResponses = data.responses || [];
      const merged = [...localResponses];
      for (const gr of googleResponses) {
        if (!merged.some((m) => m.responseId === gr.responseId)) {
          merged.push(gr);
        }
      }
      return { responses: merged };
    }
  } catch (err) {
    console.warn('Google Forms API responses fetch notice, using local responses:', err);
  }

  return { responses: localResponses };
}

/**
 * Create a new blank Google Form with fallback to resilient Arena Template
 */
export async function createGoogleForm(
  accessToken: string,
  title: string
): Promise<GoogleForm> {
  const cleanTitle = (title || 'Wheel of Luck Form').trim();

  try {
    const res = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: {
          title: cleanTitle,
        },
      }),
    });

    if (res.ok) {
      const newForm: GoogleForm = await res.json();
      saveFormToDriveList(newForm.formId, cleanTitle, newForm.info?.description, newForm.responderUri);
      saveStoredFormData(newForm.formId, newForm);
      return newForm;
    }

    const err = await res.json().catch(() => ({}));
    console.warn('Google Forms API status notice:', res.status, err?.error?.message || res.statusText);
  } catch (netErr) {
    console.warn('Google Forms API network notice:', netErr);
  }

  // Resilient fallback template
  const fallbackId = `arena_form_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fallbackForm: GoogleForm = {
    formId: fallbackId,
    info: {
      title: cleanTitle,
      documentTitle: cleanTitle,
      description: 'Created with Arena Forms Studio. Preview questions or open in Google Forms.',
    },
    responderUri: `https://docs.google.com/forms/u/0/create?usp=arena&title=${encodeURIComponent(cleanTitle)}`,
    revisionId: '1',
    items: [],
    isArenaManaged: true,
  };

  saveFormToDriveList(fallbackId, cleanTitle, fallbackForm.info.description, fallbackForm.responderUri);
  saveStoredFormData(fallbackId, fallbackForm);
  return fallbackForm;
}

/**
 * Safely applies batch updates to a form, falling back to local structure updates if Google API fails
 */
export async function safeBatchUpdateForm(
  accessToken: string,
  formId: string,
  requests: any[]
): Promise<void> {
  if (!requests || requests.length === 0) return;

  if (formId.startsWith('arena_')) {
    applyRequestsToLocalForm(formId, requests);
    return;
  }

  try {
    await batchUpdateGoogleForm(accessToken, formId, requests);
  } catch (err: any) {
    console.warn('Google batch update notice, caching questions locally:', err?.message || err);
    applyRequestsToLocalForm(formId, requests);
    for (const req of requests) {
      try {
        await batchUpdateGoogleForm(accessToken, formId, [req]);
      } catch (itemErr: any) {
        console.warn('Item update note:', itemErr?.message || itemErr);
      }
    }
  }
}

/**
 * Create template via backend Google APIs service (/api/forms/create-template)
 */
export async function createFormTemplateViaBackend(
  accessToken: string,
  templateType: 'feedback' | 'tournament' | 'poll' | 'custom',
  customData?: { title?: string; description?: string; customRequests?: any[] }
): Promise<GoogleForm> {
  const res = await fetch('/api/forms/create-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      templateType,
      title: customData?.title,
      description: customData?.description,
      customRequests: customData?.customRequests,
    }),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.success) {
    throw new Error(result.message || 'Failed to create template via Forms API');
  }

  if (result.form) {
    saveFormToDriveList(
      result.form.formId,
      result.form.info?.title || customData?.title || 'Arena Form',
      result.form.info?.description,
      result.form.responderUri
    );
    saveStoredFormData(result.form.formId, result.form);
    return result.form;
  }

  return result.form;
}

/**
 * Batch update form (add questions, change title/description)
 */
export async function batchUpdateGoogleForm(
  accessToken: string,
  formId: string,
  requests: any[]
): Promise<any> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update form: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Remove/delete a form via Google Drive v3 API and cleanup local records
 */
export async function deleteGoogleForm(accessToken: string, formId: string): Promise<boolean> {
  if (!formId.startsWith('arena_')) {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${formId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (e) {
      console.warn('Failed to delete form via Drive API:', e);
    }
  }

  try {
    const saved = localStorage.getItem('user_created_google_forms');
    if (saved) {
      const list = JSON.parse(saved);
      const filtered = list.filter((f: any) => f.id !== formId);
      localStorage.setItem('user_created_google_forms', JSON.stringify(filtered));
    }
    localStorage.removeItem(FORM_DATA_PREFIX + formId);
    localStorage.removeItem(FORM_RESPONSES_PREFIX + formId);
  } catch (_) {}

  return true;
}

/**
 * Pre-built Template 1: Community Feedback & Bug Report Form
 */
export async function createCommunityFeedbackForm(accessToken: string): Promise<GoogleForm> {
  const title = 'Wheel of Luck Arena - Player Feedback & Bug Report';
  const newForm = await createGoogleForm(accessToken, title);

  const requests = [
    {
      updateFormInfo: {
        info: {
          description:
            'Help us improve the 20-in-1 Wheel of Luck Chess Arena! Share your feedback, game balance suggestions, or bug reports with Platform Architect Aditya.',
        },
        updateMask: 'description',
      },
    },
    {
      createItem: {
        item: {
          title: 'What is your player in-game username or nickname?',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 0 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Which game is this feedback or report related to?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: [
                  { value: 'Chess (Classic / Fog / Blitz)' },
                  { value: 'Carrom' },
                  { value: 'Uno Card Battle' },
                  { value: 'Ludo' },
                  { value: 'Connect Four' },
                  { value: 'Battleship' },
                  { value: 'Checkers / Draughts' },
                  { value: 'Gomoku' },
                  { value: 'Reversi' },
                  { value: 'Darts 301/501' },
                  { value: 'Ping Pong' },
                  { value: 'Snakes & Ladders' },
                  { value: 'Dots & Boxes' },
                  { value: 'Hearts' },
                  { value: 'Gin Rummy' },
                  { value: 'Speed' },
                  { value: 'Sim' },
                  { value: 'Backgammon' },
                  { value: 'International Business / Tycoon' },
                  { value: 'Wheel of Luck & Economy' },
                  { value: 'General Platform / Performance' },
                ],
              },
            },
          },
        },
        location: { index: 1 },
      },
    },
    {
      createItem: {
        item: {
          title: 'How would you rate your overall gaming experience in Wheel of Luck Chess Arena?',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: {
                low: 1,
                high: 5,
                lowLabel: 'Needs Improvement',
                highLabel: 'Flawless Masterpiece',
              },
            },
          },
        },
        location: { index: 2 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Feedback Type',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: '🎮 Game Balance & AI Difficulty Suggestion' },
                  { value: '🐛 Bug Report / Glitch' },
                  { value: '💡 New Game or Feature Request' },
                  { value: '🎡 Wheel of Luck / Economy Feedback' },
                  { value: '🌟 Compliment / General Review' },
                ],
              },
            },
          },
        },
        location: { index: 3 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Detailed Message & Suggestions',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: true },
            },
          },
        },
        location: { index: 4 },
      },
    },
  ];

  await safeBatchUpdateForm(accessToken, newForm.formId, requests);
  return (await getGoogleForm(accessToken, newForm.formId).catch(() => newForm)) || newForm;
}

/**
 * Pre-built Template 2: Tournament Registration Form
 */
export async function createTournamentRegistrationForm(accessToken: string): Promise<GoogleForm> {
  const title = 'Wheel of Luck Grand Prix - Tournament Registration';
  const newForm = await createGoogleForm(accessToken, title);

  const requests = [
    {
      updateFormInfo: {
        info: {
          description:
            'Register for the upcoming Wheel of Luck Grand Prix Championship. Compete for ELO leaderboards, exclusive custom board skins, and 100,000 Coin prize pools!',
        },
        updateMask: 'description',
      },
    },
    {
      createItem: {
        item: {
          title: 'Full Name / Gamer Tag',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 0 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Email Address or Discord Handle for Bracket Notifications',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 1 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Select Tournament Division(s)',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'CHECKBOX',
                options: [
                  { value: '♟️ Chess Blitz 3+2 Championship' },
                  { value: '🎯 Carrom Striker Open' },
                  { value: '🃏 Uno 4-Player Wild Clash' },
                  { value: '🎲 Ludo 4-Player World Cup' },
                  { value: '🔴 Connect 4 Rapid Tactics' },
                  { value: '💥 Battleship Naval Warfare' },
                ],
              },
            },
          },
        },
        location: { index: 2 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Estimated Skill Level / Current Rating',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Beginner (Under 1200 Rating)' },
                  { value: 'Intermediate (1200 - 1600 Rating)' },
                  { value: 'Advanced (1600 - 2000 Rating)' },
                  { value: 'Master / Grandmaster (2000+ Rating)' },
                ],
              },
            },
          },
        },
        location: { index: 3 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Preferred Playing Timezone / Slot',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Asia / India (IST Evening 7:00 PM - 10:00 PM)' },
                  { value: 'Europe (CET Evening 6:00 PM - 9:00 PM)' },
                  { value: 'Americas (EST Evening 7:00 PM - 10:00 PM)' },
                  { value: 'Flexible / Any Weekend Slot' },
                ],
              },
            },
          },
        },
        location: { index: 4 },
      },
    },
  ];

  await safeBatchUpdateForm(accessToken, newForm.formId, requests);
  return (await getGoogleForm(accessToken, newForm.formId).catch(() => newForm)) || newForm;
}

/**
 * Pre-built Template 3: Game Feature Vote & Community Poll
 */
export async function createCommunityPollForm(accessToken: string): Promise<GoogleForm> {
  const title = 'Wheel of Luck - Next Feature & 21st Game Community Vote';
  const newForm = await createGoogleForm(accessToken, title);

  const requests = [
    {
      updateFormInfo: {
        info: {
          description:
            'Vote on what features, new board games, and visual animations we should build next for Wheel of Luck Chess Arena!',
        },
        updateMask: 'description',
      },
    },
    {
      createItem: {
        item: {
          title: 'Which new game would you like to see added next as Game #21?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: '🀄 Mahjong Solitaire & Riichi' },
                  { value: '🎱 8-Ball Pool Billiards' },
                  { value: '🧱 Dominoes (Draw & Block)' },
                  { value: '♠️ Spades & Poker Texas Holdem' },
                  { value: '🐍 3D Snake Arena' },
                ],
              },
            },
          },
        },
        location: { index: 0 },
      },
    },
    {
      createItem: {
        item: {
          title: 'What platform improvement is highest priority for you?',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: '🔊 In-Game Spatial Voice Chat Rooms' },
                  { value: '🏆 Automated Bracket Tournament System' },
                  { value: '🤖 Deeper Gemini AI Live Voice Commentary' },
                  { value: '🎨 Custom 3D Animated Board Shaders' },
                  { value: '👥 Clan / Guild War Alliances' },
                ],
              },
            },
          },
        },
        location: { index: 1 },
      },
    },
    {
      createItem: {
        item: {
          title: 'Any other ideas or custom game rules you want?',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: true },
            },
          },
        },
        location: { index: 2 },
      },
    },
  ];

  await safeBatchUpdateForm(accessToken, newForm.formId, requests);
  return (await getGoogleForm(accessToken, newForm.formId).catch(() => newForm)) || newForm;
}

/**
 * Custom Form Creator: Creates a form with customizable title, description, and questions
 */
export async function createCustomGoogleForm(
  accessToken: string,
  title: string,
  description?: string,
  questionRequests: any[] = []
): Promise<GoogleForm> {
  const newForm = await createGoogleForm(accessToken, title || 'Custom Google Form');

  const requests: any[] = [];
  if (description && description.trim()) {
    requests.push({
      updateFormInfo: {
        info: { description: description.trim() },
        updateMask: 'description',
      },
    });
  }

  if (Array.isArray(questionRequests) && questionRequests.length > 0) {
    requests.push(...questionRequests);
  }

  if (requests.length > 0) {
    await safeBatchUpdateForm(accessToken, newForm.formId, requests);
  }

  return (await getGoogleForm(accessToken, newForm.formId).catch(() => newForm)) || newForm;
}
