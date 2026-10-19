import re
import logging
from typing import Optional, Tuple
from app.models.schemas import RelevanceResult
from app.config import settings

logger = logging.getLogger(__name__)

# Fixed server-side warning as strictly requested
STANDARD_REJECTION_WARNING = (
    "⚠️ This question is outside the scope of CollegeConnect AI. "
    "I can only assist with college-related queries, including academics, "
    "examinations, admissions, placements, campus facilities, and student services. "
    "Please ask a college-related question."
)

# Prompt Injection & Jailbreak patterns
PROMPT_INJECTION_PATTERNS = [
    r"(?i)\b(ignore|bypass|override|forget|disregard|drop|cancel)\b.*?\b(all|previous|prior|system|rule|restrictions?|instructions?|guidelines?|prompts?)\b",
    r"(?i)\b(disable|turn off|remove|delete)\b.*?\b(restriction|filter|college|guard|rules?|safety|boundary)\b",
    r"(?i)\bpretend\s+you\s+are\b.*?\b(general|unrestricted|dan|jailbreak|evil|chatgpt|anything|ai\s+without\s+rules)\b",
    r"(?i)\breveal\b.*?\b(system\s+prompt|internal\s+rules|developer\s+mode|hidden\s+instructions?)\b",
    r"(?i)\byou\s+are\s+now\b.*?\b(free|unfiltered|jailbroken|an\s+unrestricted)\b",
    r"(?i)\bdo\s+anything\s+now\b",
    r"(?i)\bjailbreak\b",
    r"(?i)\boutput\s+your\s+instructions\b",
    r"(?i)\bwhat\s+is\s+your\s+system\s+prompt\b"
]

# Student Welfare & Mental Health Support indicators (Must ALWAYS be accepted)
STUDENT_WELFARE_PATTERNS = [
    r"(?i)\b(stressed|stress|anxiety|anxious|depressed|depression|overwhelmed|panic|burnout|mental\s+health)\b",
    r"(?i)\b(counselor|counseling|therapist|wellness|psychologist)\b",
    r"(?i)\b(ragging|bullied|bullying|harass|harassment|ragged|threatened\s+on\s+campus)\b",
    r"(?i)\b(afraid\s+of\s+failing|scared\s+of\s+exams?|suicid|hopeless|lonely\s+in\s+hostel)\b",
    r"(?i)\bhelp\s+me\s+cope\b"
]

# Clear out-of-scope non-college topics
OUT_OF_SCOPE_PATTERNS = [
    (r"(?i)\b(pasta|pizza|recipe|cook|bake|ingredients?|dinner|lunch|breakfast\s+dish|soup|cake|baking)\b", "Cooking / Recipe request"),
    (r"(?i)\b(tell\s+me\s+a\s+joke|make\s+me\s+laugh|funny\s+joke|tell\s+a\s+joke|another\s+joke|riddle|knock\s+knock)\b", "Entertainment / Joke request"),
    (r"(?i)\b(romantic\s+poem|love\s+poem|write\s+a\s+poem|love\s+letter|flirt|girlfriend|boyfriend|romance)\b", "Romantic / Creative writing request"),
    (r"(?i)\b(best\s+movie\s+to\s+watch|recommend\s+a\s+movie|watch\s+movie|netflix|hollywood|bollywood|tv\s+series)\b", "Movie / Pop culture recommendation"),
    (r"(?i)\b(play\s+a\s+game|play\s+with\s+me|fortnite|minecraft|valorant|chess\s+move|video\s+games?)\b", "Game / Gaming request"),
    (r"(?i)\b(capital\s+of\s+[a-z]+|who\s+discovered\s+[a-z]+|tallest\s+mountain|how\s+far\s+is\s+the\s+moon|speed\s+of\s+light)\b", "General trivia / Non-college query"),
    (r"(?i)\b(crypto|bitcoin|stock\s+market|investing\s+tips|buy\s+shares)\b", "Financial trading / Non-college finance"),
    (r"(?i)\b(weather\s+in\s+[a-z]+|forecast\s+for\s+[a-z]+)\b", "General weather inquiry")
]

# College domain keywords and intents
COLLEGE_KEYWORDS = [
    "attendance", "attend", "absent", "absence", "leave", "medical leave", "condonation", "detention",
    "exam", "exams", "examination", "mid-term", "semester", "backlog", "supplementary", "hall ticket",
    "admit card", "re-evaluation", "marksheet", "grade", "cgpa", "sgpa", "gpa", "credits",
    "placement", "placements", "internship", "internships", "tpo", "companies", "recruitment", "interview",
    "resume", "package", "job", "campus drive",
    "bonafide", "certificate", "id card", "identity card", "transcripts", "provisional",
    "admission", "admissions", "cutoff", "quota", "eligibility", "btech", "mtech", "mba", "b.tech", "m.tech",
    "fees", "fee", "tuition", "challan", "dues", "scholarship", "scholarships", "concession", "financial aid",
    "faculty", "professor", "lecturer", "hod", "dean", "director", "registrar", "mentor",
    "department", "cse", "ece", "mechanical", "civil", "it", "cs102", "branch",
    "library", "books", "borrow", "digital library", "ieee", "acm",
    "hostel", "room", "warden", "curfew", "mess", "canteen", "cafeteria", "transport", "bus", "health center",
    "anti-ragging", "ragging", "counselor", "counseling", "grievance", "student welfare",
    "college", "campus", "university", "syllabus", "timetable", "curriculum", "course", "subjects",
    "aits", "apex institute", "class", "lecture", "lab", "laboratory"
]

# Ambiguous subjects that might be part of college syllabus (e.g. Python, Java, Calculus, etc.)
AMBIGUOUS_ACADEMIC_PATTERNS = [
    r"(?i)^\s*(can\s+you\s+)?explain\s+(python|java|c\+\+|sql|data\s+structures|calculus|thermodynamics|circuit\s+theory)\s*\??\s*$",
    r"(?i)^\s*what\s+is\s+(python|object\s+oriented\s+programming|dsa|recursion|machine\s+learning)\s*\??\s*$",
    r"(?i)^\s*teach\s+me\s+(python|coding|programming)\s*\??\s*$",
    r"(?i)^\s*help\s+with\s+(python|cs102|coding\s+assignment)\s*\??\s*$"
]

class RelevanceClassifier:
    """
    Independent relevance classifier running prior to answer generation.
    Strictly prevents out-of-scope or prompt injection requests from reaching
    the main language model.
    """

    @classmethod
    def check_prompt_injection(cls, message: str) -> Optional[str]:
        for pattern in PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, message):
                return "Prompt injection or restriction bypass attempt detected."
        return None

    @classmethod
    def check_student_welfare(cls, message: str) -> bool:
        for pattern in STUDENT_WELFARE_PATTERNS:
            if re.search(pattern, message):
                return True
        return False

    @classmethod
    def check_out_of_scope(cls, message: str) -> Optional[str]:
        for pattern, reason in OUT_OF_SCOPE_PATTERNS:
            if re.search(pattern, message):
                return reason
        return None

    @classmethod
    def check_ambiguous_academic(cls, message: str) -> Optional[str]:
        for pattern in AMBIGUOUS_ACADEMIC_PATTERNS:
            match = re.search(pattern, message.strip())
            if match:
                subject = match.group(2) if len(match.groups()) >= 2 and match.group(2) else "this academic topic"
                return subject
        return None

    @classmethod
    def has_college_context(cls, message: str) -> bool:
        msg_lower = message.lower()
        for kw in COLLEGE_KEYWORDS:
            if re.search(rf"\b{re.escape(kw)}\b", msg_lower):
                return True
        return False

    @classmethod
    def classify(cls, message: str) -> RelevanceResult:
        clean_msg = message.strip()

        # Step 1: Prompt Injection / System Instruction override check
        injection_reason = cls.check_prompt_injection(clean_msg)
        if injection_reason:
            logger.warning("Prompt injection blocked: '%s'", clean_msg)
            return RelevanceResult(
                status="REJECTED",
                reason=injection_reason,
                is_jailbreak_attempt=True,
                category="security_violation"
            )

        # Step 2: Student Welfare & Emotional Well-being check (Rule 8: Always accept)
        if cls.check_student_welfare(clean_msg):
            logger.info("Accepted as student welfare: '%s'", clean_msg)
            return RelevanceResult(
                status="ACCEPTED",
                reason="Legitimate student welfare, academic stress, or campus safety inquiry.",
                category="student_welfare"
            )

        # Step 3: Clear Out-of-Scope Topics Check (Rule 2: Jokes, recipes, entertainment, etc.)
        oos_reason = cls.check_out_of_scope(clean_msg)
        if oos_reason and not cls.has_college_context(clean_msg):
            logger.info("Rejected out of scope query (%s): '%s'", oos_reason, clean_msg)
            return RelevanceResult(
                status="REJECTED",
                reason=oos_reason,
                category="out_of_scope"
            )

        # Step 4: Ambiguous academic question handling (Rule 7)
        ambiguous_subject = cls.check_ambiguous_academic(clean_msg)
        if ambiguous_subject:
            logger.info("Ambiguous academic subject detected: '%s'", ambiguous_subject)
            return RelevanceResult(
                status="CLARIFY",
                reason=f"Ambiguous query regarding {ambiguous_subject}. Clarifying college course context.",
                category="academic_curriculum",
                clarification_prompt=(
                    f"Are you asking about the course syllabus/curriculum for {ambiguous_subject.capitalize()} "
                    f"(such as Course CS102: Problem Solving & Programming with Python at AITS), "
                    f"or do you need conceptual assistance with a college lab assignment?"
                )
            )

        # Step 5: College Keyword & Context Verification
        if cls.has_college_context(clean_msg):
            logger.info("Accepted college query: '%s'", clean_msg)
            return RelevanceResult(
                status="ACCEPTED",
                reason="Verified college-related inquiry.",
                category="college_general"
            )

        # Fallback check: If the message contains no college terms and no student context
        # Short casual greetings can be accepted with a helpful college intro
        if clean_msg.lower() in ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "help"]:
            return RelevanceResult(
                status="ACCEPTED",
                reason="College assistant greeting.",
                category="greeting"
            )

        # Any other unrelated question is rejected by default to maintain strict relevance
        logger.info("Rejected unrecognized non-college query: '%s'", clean_msg)
        return RelevanceResult(
            status="REJECTED",
            reason="Query does not contain college-specific context, academics, or student services.",
            category="out_of_scope"
        )


def evaluate_relevance(message: str) -> RelevanceResult:
    """Convenience function to classify a user message."""
    return RelevanceClassifier.classify(message)
