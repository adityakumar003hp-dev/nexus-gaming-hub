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
}

/**
 * List all Google Forms owned/accessible by the user without requiring Drive API
 */
export async function listGoogleForms(_accessToken: string): Promise<DriveFormFile[]> {
  try {
    const saved = localStorage.getItem('user_created_google_forms');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read cached forms:', e);
  }
  return [];
}

/**
 * Get form details (structure, questions, title, responderUri) from Google Forms API
 */
export async function getGoogleForm(accessToken: string, formId: string): Promise<GoogleForm> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to load form details: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Get all responses for a form from Google Forms API
 */
export async function getGoogleFormResponses(
  accessToken: string,
  formId: string
): Promise<{ responses?: GoogleFormResponse[] }> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to load form responses: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Create a new blank Google Form
 */
export async function createGoogleForm(
  accessToken: string,
  title: string
): Promise<GoogleForm> {
  const res = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: title,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create form: ${res.statusText}`);
  }

  return await res.json();
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
 * Remove a form from local record without requiring Drive API scopes
 */
export async function deleteGoogleForm(_accessToken: string, formId: string): Promise<boolean> {
  try {
    const saved = localStorage.getItem('user_created_google_forms');
    if (saved) {
      const list = JSON.parse(saved);
      const filtered = list.filter((f: any) => f.id !== formId);
      localStorage.setItem('user_created_google_forms', JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('Failed to update stored forms:', e);
  }
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

  await batchUpdateGoogleForm(accessToken, newForm.formId, requests);
  return await getGoogleForm(accessToken, newForm.formId);
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

  await batchUpdateGoogleForm(accessToken, newForm.formId, requests);
  return await getGoogleForm(accessToken, newForm.formId);
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

  await batchUpdateGoogleForm(accessToken, newForm.formId, requests);
  return await getGoogleForm(accessToken, newForm.formId);
}
