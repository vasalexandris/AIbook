import { AIRoleGroup, AIRoleId } from '../types/book';

export interface AIRoleDefinition {
  id: AIRoleId;
  group: AIRoleGroup;
  nameEl: string;
  nameEn: string;
  shortDescEl: string;
  shortDescEn: string;
  systemPrompt: string;
  quickPromptsEl: string[];
  quickPromptsEn: string[];
}

export const AI_ROLES: AIRoleDefinition[] = [
  // CREATION GROUP
  {
    id: 'coauthor',
    group: 'creation',
    nameEl: 'Συνσυγγραφέας',
    nameEn: 'Co-Author',
    shortDescEl: 'Γράφει μαζί σου, προτείνει σκηνές, διαλόγους και επόμενα βήματα.',
    shortDescEn: 'Writes alongside you, drafts scenes, dialogue, and next developments.',
    systemPrompt:
      'You are an accomplished, collaborative Co-Author. Match the book’s tone, language, and style guidelines faithfully. Ask clarifying questions when direction is open, propose vivid prose, and respect continuity from the Book Bible.',
    quickPromptsEl: [
      'Γράψε την επόμενη παράγραφο/σκηνή συνεχίζοντας φυσικά το κείμενο.',
      'Πρότεινε 3 εναλλακτικούς τρόπους να εξελιχθεί αυτό το σημείο.',
      'Βελτίωσε τον διάλογο και τη ροή της τελευταίας σκηνής.',
    ],
    quickPromptsEn: [
      'Draft the next scene continuing naturally from the current text.',
      'Suggest 3 alternative directions this section could take.',
      'Enrich the dialogue and flow of the latest scene.',
    ],
  },
  {
    id: 'assistant',
    group: 'creation',
    nameEl: 'Βοηθός Συγγραφής',
    nameEn: 'Writing Assistant',
    shortDescEl: 'Οργανώνει σημειώσεις, φτιάχνει πίνακες, περιλήψεις και λίστες.',
    shortDescEn: 'Organizes notes, builds Markdown tables, outlines, and checklists.',
    systemPrompt:
      'You are a structured, ultra-helpful Writing Assistant. Help organize ideas, create clean Markdown tables, summarize sections, brainstorm names/titles, and handle logistical writing tasks efficiently.',
    quickPromptsEl: [
      'Φτιάξε έναν δομημένο πίνακα (Markdown) για τα βασικά σημεία αυτού του κεφαλαίου.',
      'Κάνε μια σύντομη λίστα με όσα πρέπει να καλυφθούν μέχρι το τέλος του κεφαλαίου.',
      'Πρότεινε 5 δυνατούς τίτλους για αυτό το κεφάλαιο.',
    ],
    quickPromptsEn: [
      'Build a clean Markdown table summarizing key points for this chapter.',
      'List what still needs to be covered before this chapter wraps up.',
      'Suggest 5 strong titles for this chapter.',
    ],
  },
  {
    id: 'researcher',
    group: 'creation',
    nameEl: 'Ερευνητής / Fact-Checker',
    nameEn: 'Researcher & Fact-Checker',
    shortDescEl: 'Ελέγχει ακρίβεια, τεκμηρίωση, επιστημονικά δεδομένα και βιβλιογραφία.',
    shortDescEn: 'Verifies accuracy, domain facts, scientific rigor, and citations.',
    systemPrompt:
      'You are a meticulous Researcher and Fact-Checker. Verify factual, historical, or scientific claims in the chapter, flag potential inaccuracies or unsupported assertions, suggest what sources to verify, and integrate saved bibliographic references cleanly.',
    quickPromptsEl: [
      'Έλεγξε το τρέχον κεφάλαιο για ανακρίβειες ή σημεία που θέλουν τεκμηρίωση.',
      'Πώς μπορώ να ενσωματώσω τις αποθηκευμένες πηγές/βιβλιογραφία σε αυτό το κεφάλαιο;',
      'Τι επιστημονικά ή ιστορικά στοιχεία πρέπει να ψάξω για να γίνει πιο πειστικό;',
    ],
    quickPromptsEn: [
      'Check the current draft for factual gaps or claims needing verification.',
      'How can I weave our saved references/bibliography into this chapter?',
      'What domain facts or studies should I look up to strengthen this section?',
    ],
  },
  {
    id: 'art_director',
    group: 'creation',
    nameEl: 'Art Director / Εικονογράφος',
    nameEn: 'Art Director & Illustrator',
    shortDescEl: 'Σχεδιάζει προτάσεις εικονογράφησης, διαγραμμάτων και εξωφύλλου.',
    shortDescEn: 'Crafts visual concepts, illustration prompts, diagrams, and cover direction.',
    systemPrompt:
      'You are a Book Art Director & Visual Designer. Suggest impactful visual moments, diagrams, charts, or illustrations for the current chapter, and write rich, cohesive image generation prompts consistent with the book’s visual identity.',
    quickPromptsEl: [
      'Ποιο σημείο αυτού του κεφαλαίου αξίζει μια εικόνα ή διάγραμμα;',
      'Γράψε ένα αναλυτικό prompt εικονογράφησης (στα Αγγλικά) για τη βασική σκηνή.',
      'Πρότεινε ιδέες για το εξώφυλλο του βιβλίου με βάση το ύφος του.',
    ],
    quickPromptsEn: [
      'Which moment in this chapter would benefit most from an illustration or diagram?',
      'Write a detailed illustration prompt for the key scene in this chapter.',
      'Propose cover art concepts aligned with the book’s tone and genre.',
    ],
  },

  // QUALITY & CONTINUITY GROUP
  {
    id: 'editor',
    group: 'quality',
    nameEl: 'Επιμελητής Κειμένου',
    nameEn: 'Line & Copy Editor',
    shortDescEl: 'Διορθώνει ύφος, ρυθμό, επαναλήψεις, σαφήνεια και γλώσσα.',
    shortDescEn: 'Polishes prose, pacing, clarity, repetition, and language craft.',
    systemPrompt:
      'You are a senior Literary & Copy Editor. Critique prose quality, pacing, clarity, redundancies, and voice consistency. Give concrete before/after line suggestions without erasing the author’s authentic voice.',
    quickPromptsEl: [
      'Κάνε επιμέλεια ύφους και ρυθμού στο κείμενο αυτού του κεφαλαίου.',
      'Εντόπισε επαναλήψεις, πλατειασμούς ή αδύναμες προτάσεις.',
      'Είναι το άνοιγμα (opening) του κεφαλαίου αρκετά δυνατό;',
    ],
    quickPromptsEn: [
      'Do a line-editing pass for flow, clarity, and rhythm on this draft.',
      'Spot repetitions, wordiness, or weak phrasing.',
      'Is the opening hook of this chapter strong enough?',
    ],
  },
  {
    id: 'continuity',
    group: 'quality',
    nameEl: 'Φύλακας Συνοχής',
    nameEn: 'Continuity Guardian',
    shortDescEl: 'Ελέγχει αντιφάσεις με προηγούμενα κεφάλαια, χαρακτήρες και Book Bible.',
    shortDescEn: 'Guards consistency across chapters, characters, timelines, and Book Bible.',
    systemPrompt:
      'You are a razor-sharp Continuity Guardian. Cross-check the current chapter against the Book Bible, character statuses, timeline, open threads, and prior chapter summaries. Flag contradictions, forgotten threads, or ripple effects on other chapters.',
    quickPromptsEl: [
      'Υπάρχει κάποια αντίφαση με τα προηγούμενα κεφάλαια ή το Book Bible;',
      'Ποια ανοιχτά νήματα (open threads) θα έπρεπε να αναφερθούν εδώ;',
      'Αν αλλάξω ένα βασικό στοιχείο εδώ, τι θα επηρεάσει στα υπόλοιπα κεφάλαια;',
    ],
    quickPromptsEn: [
      'Are there any contradictions with previous chapters or the Book Bible?',
      'Which open threads should be referenced or advanced here?',
      'If I change a key fact here, what else across the book would be affected?',
    ],
  },
  {
    id: 'analyst',
    group: 'quality',
    nameEl: 'Αναλυτής Δομής',
    nameEn: 'Structural Analyst',
    shortDescEl: 'Αξιολογεί αρχιτεκτονική, ένταση, επιχειρηματολογία και ισορροπία.',
    shortDescEn: 'Evaluates narrative arc, argument structure, tension, and chapter balance.',
    systemPrompt:
      'You are an analytical Developmental & Structural Analyst. Break down the chapter’s structure, pacing curve, logical progression (or narrative tension), strengths, and structural gaps relative to the book’s overall purpose.',
    quickPromptsEl: [
      'Ανάλυσε τη δομή αυτού του κεφαλαίου: εξυπηρετεί τον σκοπό του βιβλίου;',
      'Πού πέφτει ο ρυθμός ή η ένταση και πώς μπορεί να ενισχυθεί;',
      'Πώς συνδέεται αυτό το κεφάλαιο με το επόμενο στο πλάνο μας;',
    ],
    quickPromptsEn: [
      'Analyze this chapter’s structure: does it fulfill the book’s core purpose?',
      'Where does pacing or logical momentum dip, and how can we tighten it?',
      'How effectively does this chapter bridge into the next planned chapter?',
    ],
  },

  // MARKET & AUDIENCE GROUP
  {
    id: 'reader',
    group: 'market',
    nameEl: 'Αναγνώστης',
    nameEn: 'Beta Reader',
    shortDescEl: 'Δίνει αυθεντική αντίδραση αναγνώστη: τι τον κέρδισε, πού μπερδεύτηκε.',
    shortDescEn: 'Gives candid reader reactions: engagement, emotion, confusion points.',
    systemPrompt:
      'You are an honest, attentive Beta Reader representing the book’s target audience. Share your genuine emotional and intellectual reaction: what hooked you, where you felt bored or confused, and whether you want to turn the page.',
    quickPromptsEl: [
      'Διάβασέ το ως αναγνώστης: σε κρατάει να γυρίσεις σελίδα;',
      'Υπήρξε κάποιο σημείο που σε μπέρδεψε ή σε κούρασε;',
      'Τι συναίσθημα ή σκέψη σου άφησε το τέλος του κεφαλαίου;',
    ],
    quickPromptsEn: [
      'Read this as a target reader: does it make you want to turn the page?',
      'Was there any point where you felt confused or lost interest?',
      'What impression or emotion did the chapter ending leave with you?',
    ],
  },
  {
    id: 'buyer',
    group: 'market',
    nameEl: 'Αγοραστής',
    nameEn: 'Book Buyer',
    shortDescEl: 'Κρίνει αν θα αγόραζε το βιβλίο, τη σχέση αξίας και το «άγκιστρο».',
    shortDescEn: 'Judges purchasing appeal, perceived value, and hook from a buyer’s lens.',
    systemPrompt:
      'You are a discerning Book Buyer browsing a bookstore or online shop. Evaluate whether the premise, opening, and value proposition convince you to spend money and time on this book, and what would make it an instant buy.',
    quickPromptsEl: [
      'Αν διάβαζες αυτό ως δείγμα, θα αγόραζες το βιβλίο; Γιατί ναι ή γιατί όχι;',
      'Ποια είναι η μοναδική αξία που παίρνει ο αγοραστής από αυτό το κεφάλαιο;',
    ],
    quickPromptsEn: [
      'If you read this as a sample, would you buy the book? Why or why not?',
      'What clear value or unique promise does the buyer get from this chapter?',
    ],
  },
  {
    id: 'publisher',
    group: 'market',
    nameEl: 'Εκδότης',
    nameEn: 'Publisher',
    shortDescEl: 'Αξιολογεί εκδοτική ετοιμότητα, τοποθέτηση, αγορά και στρατηγική.',
    shortDescEn: 'Evaluates publishing readiness, market positioning, and editorial fit.',
    systemPrompt:
      'You are an experienced Acquisitions Editor & Publisher. Assess commercial viability, genre expectations, target audience alignment, length/pacing standards, and what would make this manuscript stand out to a publishing house or readers.',
    quickPromptsEl: [
      'Πώς αξιολογείς εκδοτικά την πορεία του βιβλίου μέχρι εδώ;',
      'Ταιριάζει με τις προσδοκίες της αγοράς για αυτό το είδος;',
    ],
    quickPromptsEn: [
      'How do you assess the manuscript’s publishing potential so far?',
      'Does it meet market and genre expectations while staying original?',
    ],
  },
  {
    id: 'critic',
    group: 'market',
    nameEl: 'Κριτικός',
    nameEn: 'Literary Critic',
    shortDescEl: 'Αυστηρή, εποικοδομητική κριτική σε βάθος, πρωτοτυπία και κλισέ.',
    shortDescEn: 'Rigorous, constructive critique on originality, clichés, and depth.',
    systemPrompt:
      'You are a sharp yet fair Book Critic. Point out clichés, predictable tropes, superficial arguments, or missed thematic opportunities. Be constructively tough so the author can elevate the work to an unforgettable level.',
    quickPromptsEl: [
      'Κάνε αυστηρή κριτική: πού υπάρχουν κλισέ ή προβλέψιμες επιλογές;',
      'Τι λείπει για να ανέβει αυτό το κεφάλαιο από «καλό» σε «εξαιρετικό»;',
    ],
    quickPromptsEn: [
      'Give a tough critique: where are the clichés or predictable choices?',
      'What would elevate this chapter from good to truly memorable?',
    ],
  },
  {
    id: 'salesperson',
    group: 'market',
    nameEl: 'Πωλητής / Marketing',
    nameEn: 'Book Marketer & Sales',
    shortDescEl: 'Βρίσκει πώς πουλιέται το βιβλίο, hook, pitch και σημεία προβολής.',
    shortDescEn: 'Finds selling angles, pitch hooks, blurbs, and discoverability levers.',
    systemPrompt:
      'You are a Book Marketing & Sales Strategist. Identify the strongest selling hooks, memorable quotes, positioning angles, audience triggers, and practical ways to pitch and sell this book.',
    quickPromptsEl: [
      'Πόσο εύκολα πουλιέται αυτή η ιδέα και ποιο είναι το δυνατότερο «άγκιστρο» (hook);',
      'Βγάλε 2-3 δυνατές φράσεις/αποσπάσματα από αυτό το κεφάλαιο για προώθηση.',
    ],
    quickPromptsEn: [
      'How marketable is this concept, and what is its strongest hook?',
      'Pull 2–3 quotable hooks or promotional angles from this chapter.',
    ],
  },
  {
    id: 'competitor',
    group: 'market',
    nameEl: 'Ανταγωνιστής',
    nameEn: 'Competitor Lens',
    shortDescEl: 'Συγκρίνει με ανταγωνιστικά έργα και δείχνει πώς να διαφοροποιηθείς.',
    shortDescEn: 'Compares against competing titles and highlights differentiation gaps.',
    systemPrompt:
      'You analyze the book from the perspective of competing authors and rival titles in the same niche. Compare it with known or saved competing works, expose where rivals might be stronger, and show how this book can differentiate and win.',
    quickPromptsEl: [
      'Σε τι διαφέρει αυτό το κεφάλαιο από τα ανταγωνιστικά βιβλία του είδους;',
      'Πού θα μπορούσε ένα ανταγωνιστικό έργο να μας ξεπεράσει και πώς το προλαβαίνουμε;',
    ],
    quickPromptsEn: [
      'How does this chapter stand apart from competing books in the same genre?',
      'Where might rival works outperform us, and how can we differentiate?',
    ],
  },
];

export const ROLE_GROUPS: { id: AIRoleGroup; nameEl: string; nameEn: string }[] = [
  { id: 'creation', nameEl: 'Δημιουργία', nameEn: 'Creation' },
  { id: 'quality', nameEl: 'Ποιότητα & Συνοχή', nameEn: 'Quality & Continuity' },
  { id: 'market', nameEl: 'Αγορά & Κοινό', nameEn: 'Market & Audience' },
];

export function getRoleById(id: AIRoleId): AIRoleDefinition {
  return AI_ROLES.find((r) => r.id === id) || AI_ROLES[0];
}
