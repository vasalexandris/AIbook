import { AIRoleGroup, AIRoleId } from '../types/book';

export interface AIRoleQuickAction {
  labelEl: string;
  labelEn: string;
  promptEl: string;
  promptEn: string;
}

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
  quickActions?: AIRoleQuickAction[];
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
    quickActions: [
      {
        labelEl: 'Συνέχεια κειμένου',
        labelEn: 'Draft continuation',
        promptEl: 'Γράψε την επόμενη παράγραφο/σκηνή συνεχίζοντας φυσικά το κείμενο με το ύφος του βιβλίου. Δώσε το έτοιμο κείμενο σε μπλοκ εφαρμογής.',
        promptEn: 'Draft the next paragraph/scene continuing naturally in the book’s voice. Provide the ready text in an apply block.',
      },
      {
        labelEl: '2 εναλλακτικές εκδοχές',
        labelEn: '2 alternative versions',
        promptEl: 'Δώσε μου 2 διαφορετικές εναλλακτικές αναδιατυπώσεις για το επιλεγμένο κείμενο (ή τις τελευταίες παραγράφους), καθεμία σε ξεχωριστό μπλοκ εφαρμογής ώστε να διαλέξω με ένα πάτημα.',
        promptEn: 'Give me 2 distinct alternative versions for the selected text (or latest paragraphs), each in its own apply block so I can pick with one click.',
      },
      {
        labelEl: 'Εμπλουτισμός περιγραφής',
        labelEn: 'Enrich imagery',
        promptEl: 'Εμπλούτισε το επιλεγμένο απόσπασμα με πιο ζωντανές εικόνες, ρυθμό και βάθος χωρίς να αλλοιώσεις το νόημα.',
        promptEn: 'Enrich the selected passage with more vivid imagery, rhythm, and depth while preserving its meaning.',
      },
      {
        labelEl: 'Βελτίωση διαλόγου',
        labelEn: 'Sharpen dialogue',
        promptEl: 'Κάνε τους διαλόγους πιο φυσικούς, ζωντανούς και χαρακτηριστικούς για τον κάθε ομιλητή.',
        promptEn: 'Make the dialogue more natural, vivid, and distinctive to each speaker.',
      },
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
    quickActions: [
      {
        labelEl: 'Δημιουργία Πίνακα',
        labelEn: 'Build Markdown Table',
        promptEl: 'Φτιάξε έναν καθαρό πίνακα σε Markdown που συνοψίζει τα βασικά στοιχεία/δεδομένα του κειμένου.',
        promptEn: 'Build a clean Markdown table summarizing the key elements/data of this text.',
      },
      {
        labelEl: 'Λίστα Ελέγχου Κεφαλαίου',
        labelEn: 'Chapter Checklist',
        promptEl: 'Κάνε μια σύντομη λίστα με όσα έχουμε καλύψει και όσα απομένουν για να ολοκληρωθεί το κεφάλαιο.',
        promptEn: 'List what we have covered and what remains to complete this chapter.',
      },
      {
        labelEl: '5 Ιδέες Τίτλου',
        labelEn: '5 Title Ideas',
        promptEl: 'Πρότεινε 5 δυνατούς, ταιριαστούς τίτλους για αυτό το κεφάλαιο.',
        promptEn: 'Suggest 5 strong, fitting titles for this chapter.',
      },
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
    quickActions: [
      {
        labelEl: 'Έλεγχος Ακρίβειας',
        labelEn: 'Fact-Check Text',
        promptEl: 'Έλεγξε το κείμενο για ιστορικές, επιστημονικές ή πραγματολογικές ανακρίβειες και σημείωσε τι χρειάζεται τεκμηρίωση.',
        promptEn: 'Check the text for historical, scientific, or factual inaccuracies and flag claims needing citations.',
      },
      {
        labelEl: 'Ενσωμάτωση Βιβλιογραφίας',
        labelEn: 'Weave Bibliography',
        promptEl: 'Δείξε μου πού και πώς μπορώ να ενσωματώσω τις αποθηκευμένες πηγές της Βίβλου σε αυτό το κείμενο.',
        promptEn: 'Show where and how to integrate our saved Book Bible references into this passage.',
      },
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
    shortDescEl: 'Ορθογραφικός, συντακτικός, τυπογραφικός έλεγχος και επιμέλεια ύφους.',
    shortDescEn: 'Spellcheck, typos, syntax, grammar, prose polish, and alternatives.',
    systemPrompt:
      'You are a senior Literary & Copy Editor. Catch every typo, transposed letters (e.g. έκαεν -> έκανε), missing/wrong accents (τονισμός), spelling, grammar, and syntax issue. Always list what you found clearly, and provide clean, ready-to-apply corrected version(s) inside ```apply:Title ... ``` blocks so the author can apply any option with one click without erasing their authentic voice.',
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
    quickActions: [
      {
        labelEl: 'Ορθογραφικός & Τυπογραφικός Έλεγχος',
        labelEn: 'Spellcheck & Typos',
        promptEl:
          'Κάνε σχολαστικό ορθογραφικό, τυπογραφικό (αναγραμματισμούς, λάθη πληκτρολόγησης) και έλεγχο τονισμού στο κείμενο. Πρώτα δείξε σε σύντομη λίστα τα λάθη που βρήκες (π.χ. λάθος → σωστό) και μετά δώσε το ακριβές διορθωμένο κείμενο (χωρίς να αλλάξεις το ύφος μου) σε μπλοκ εφαρμογής.',
        promptEn:
          'Perform a thorough spelling, typo, and punctuation/accent check. First list each error found (wrong → right), then provide the cleanly corrected text (preserving my exact voice) in an apply block.',
      },
      {
        labelEl: 'Συντακτικός & Γραμματικός Έλεγχος',
        labelEn: 'Syntax & Grammar Check',
        promptEl:
          'Κάνε συντακτικό και γραμματικό έλεγχο στο κείμενο. Εξήγησε συνοπτικά τι προτείνεις να διορθωθεί και δώσε την καθαρή διορθωμένη εκδοχή σε μπλοκ εφαρμογής.',
        promptEn:
          'Check syntax and grammar carefully. Briefly explain each fix and provide the clean corrected version in an apply block.',
      },
      {
        labelEl: 'Ορθογραφία + 2 Εναλλακτικές Ύφους',
        labelEn: 'Proofread + 2 Style Alternatives',
        promptEl:
          'Διόρθωσε ορθογραφικά, τυπογραφικά και συντακτικά το κείμενο. Δείξε τι βρήκες και δώσε: (1) την πιστή διορθωμένη εκδοχή και (2) μια πιο ρέουσα λογοτεχνική εναλλακτική, καθεμία σε ξεχωριστό μπλοκ εφαρμογής.',
        promptEn:
          'Proofread spelling, typos, and syntax. List what you found, then give (1) a faithful corrected version and (2) a smoother literary alternative, each in its own apply block.',
      },
      {
        labelEl: 'Επιμέλεια Ύφους & Ρυθμού',
        labelEn: 'Style & Flow Polish',
        promptEl:
          'Κάνε επιμέλεια ύφους, ρυθμού και αποφυγής επαναλήψεων, και δώσε το βελτιωμένο κείμενο σε μπλοκ εφαρμογής.',
        promptEn:
          'Polish style, pacing, and eliminate repetition, and provide the improved text in an apply block.',
      },
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
