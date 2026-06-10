import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  UserCircle,
} from 'lucide-react';
import { supabase, supabaseConfigMissing } from './supabaseClient.js';
import './styles.css';

const sections = [
  {
    key: 'daily',
    title: '오늘의 일상',
    navTitle: '일상',
    prompt: '오늘 무엇을 했는가? 기억에 남는 장면은?',
    questions: [
      {
        key: 'daily_what_happened',
        text: '오늘 무엇을 했는가?',
        prompt: '오늘 한 일을 시간 흐름이나 장면 중심으로 적어보세요.',
      },
      {
        key: 'daily_memorable_scene',
        text: '기억에 남는 사건이나 장면은 무엇인가?',
        prompt: '작아도 괜찮아요. 유난히 남는 순간을 하나 골라 적어보세요.',
      },
      {
        key: 'daily_one_scene',
        text: '오늘 하루를 한 장면으로 요약하면?',
        prompt: '오늘을 대표하는 한 장면을 사진 설명처럼 적어보세요.',
      },
    ],
  },
  {
    key: 'emotion',
    title: '오늘의 감정',
    navTitle: '감정',
    prompt: '가장 강했던 감정, 원인, 행동에 준 영향',
    questions: [
      {
        key: 'emotion_strongest',
        text: '오늘 가장 강했던 감정은 무엇인가?',
        prompt: '감정을 한 단어로 시작해도 좋아요. 예: 조급함, 안정감, 피로감.',
      },
      {
        key: 'emotion_reason',
        text: '그 감정은 왜 생겼는가?',
        prompt: '상황, 생각, 사람, 몸 상태 중 무엇이 감정에 영향을 줬는지 적어보세요.',
      },
      {
        key: 'emotion_behavior_effect',
        text: '그 감정이 내 행동에 어떤 영향을 줬는가?',
        prompt: '그 감정 때문에 더 하게 된 행동이나 피하게 된 행동을 적어보세요.',
      },
    ],
  },
  {
    key: 'learning',
    title: '오늘의 배움',
    navTitle: '배움',
    prompt: '새롭게 배운 것, 알게 된 사실이나 깨달음',
    questions: [
      {
        key: 'learning_new',
        text: '오늘 새롭게 배운 것은 무엇인가?',
        prompt: '공부, 일, 관계, 생활 어디에서 얻은 배움이든 적어보세요.',
      },
      {
        key: 'learning_understood',
        text: '오늘 이해하거나 처음 알게 된 것은 무엇인가?',
        prompt: '이전보다 더 선명해진 개념이나 사실을 적어보세요.',
      },
      {
        key: 'learning_wrong_assumption',
        text: '오늘 내가 잘못 알고 있던 것은 무엇인가?',
        prompt: '오해, 착각, 과소평가, 과대평가했던 것을 적어보세요.',
      },
    ],
  },
  {
    key: 'growth',
    title: '오늘의 성장 포인트',
    navTitle: '성장',
    prompt: '실수, 반복 패턴, 다음에도 적용할 교훈',
    questions: [
      {
        key: 'growth_mistake',
        text: '오늘의 실수나 아쉬움은 무엇인가?',
        prompt: '비난이 아니라 관찰하듯이 적어보세요.',
      },
      {
        key: 'growth_pattern',
        text: '반복되는 내 패턴은 무엇인가?',
        prompt: '오늘만의 일이 아니라 자주 반복되는 반응이나 선택을 찾아보세요.',
      },
      {
        key: 'growth_lesson',
        text: '여기서 얻은 교훈이나 원칙은 무엇인가?',
        prompt: '다음에도 적용할 수 있는 짧은 원칙으로 바꿔보세요.',
      },
    ],
  },
  {
    key: 'action',
    title: '내일의 작은 행동',
    navTitle: '행동',
    prompt: '내일 하나만 다르게 한다면 무엇을 할 것인가?',
    questions: [
      {
        key: 'action_different',
        text: '내일 다르게 해볼 것은 무엇인가?',
        prompt: '작고 구체적인 변화 하나를 적어보세요.',
      },
      {
        key: 'action_priority',
        text: '내일 가장 중요한 행동 하나는 무엇인가?',
        prompt: '내일 이것 하나만 해도 괜찮다고 할 행동을 정해보세요.',
      },
      {
        key: 'action_apply_lesson',
        text: '오늘의 교훈을 어떻게 적용할 것인가?',
        prompt: '시간, 장소, 행동이 보이도록 구체적으로 적어보세요.',
      },
    ],
  },
];

const diarySteps = sections.flatMap((section, sectionIndex) =>
  section.questions.map((question, questionIndex) => ({
    ...question,
    sectionKey: section.key,
    sectionTitle: section.title,
    sectionPrompt: section.prompt,
    sectionIndex,
    questionIndex,
  })),
);

const totalFlowSteps = diarySteps.length + 1;

const emptyDraft = (date = todayKey()) => ({
  id: null,
  entry_date: date,
  answers: emptyAnswers(),
  created_at: null,
  updated_at: null,
});

function App() {
  if (supabaseConfigMissing) {
    return <ConfigMissing />;
  }

  return <DiaryApp />;
}

function DiaryApp() {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [activePage, setActivePage] = useState('write');
  const [selectedReadId, setSelectedReadId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState('forward');

  const completedCount = diarySteps.filter(
    (step) => draft.answers?.[step.key]?.trim(),
  ).length;
  const progressPercent = (activeStep / diarySteps.length) * 100;
  const progressLabel =
    activeStep === 0 ? 'DATE' : `STEP ${activeStep} OF ${diarySteps.length}`;

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    setDraft(emptyDraft(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    setSlideDirection('forward');
    setActiveStep(0);
  }, [selectedDate]);

  useEffect(() => {
    if (entries.length === 0) {
      setSelectedReadId(null);
      return;
    }

    if (!entries.some((entry) => entry.id === selectedReadId)) {
      setSelectedReadId(entries[0].id);
    }
  }, [entries, selectedReadId]);

  async function fetchEntries() {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('diary_entries')
      .select('*')
      .order('entry_date', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const nextEntries = data.map(normalizeEntry);
      setEntries(nextEntries);
    }

    setLoading(false);
  }

  function updateDraft(key, value) {
    setDraft((current) => ({
      ...current,
      answers: {
        ...emptyAnswers(),
        ...(current.answers ?? {}),
        [key]: value,
      },
    }));
  }

  function goToStep(nextStep) {
    const safeStep = Math.min(Math.max(nextStep, 0), totalFlowSteps - 1);
    if (safeStep === activeStep) return;

    setSlideDirection(safeStep > activeStep ? 'forward' : 'back');
    setActiveStep(safeStep);
  }

  async function saveDraft() {
    setSaving(true);
    setError('');

    const answers = sanitizeAnswers(draft.answers);
    const payload = {
      entry_date: draft.entry_date,
      answers,
    };

    const { data, error: saveError } = await supabase
      .from('diary_entries')
      .upsert(payload, { onConflict: 'entry_date' })
      .select()
      .single();

    if (saveError) {
      setError(saveError.message);
    } else {
      const saved = normalizeEntry(data);
      setEntries((current) =>
        [saved, ...current.filter((entry) => entry.id !== saved.id)]
          .filter(uniqueByDate)
          .sort(latestFirst),
      );
      setSelectedDate(saved.entry_date);
      setDraft(emptyDraft(saved.entry_date));
    }

    setSaving(false);
  }

  return (
    <div className="app-shell">
      <header className="global-nav">
        <button
          className="gnb-brand"
          type="button"
          onClick={() => setActivePage('write')}
          aria-label="작성 페이지로 이동"
        >
          My Sanctuary
        </button>
        <nav className="gnb-links" aria-label="전체 네비게이션">
          <button
            className={activePage === 'write' ? 'active' : ''}
            type="button"
            onClick={() => setActivePage('write')}
          >
            작성하기
          </button>
          <button
            className={activePage === 'read' ? 'active' : ''}
            type="button"
            onClick={() => {
              setActivePage('read');
              fetchEntries();
            }}
          >
            나의 일기(읽기)
          </button>
          <button type="button">통계</button>
          <button type="button">설정</button>
        </nav>
        <UserCircle className="gnb-user" size={27} strokeWidth={1.8} />
      </header>

      {activePage === 'write' ? (
        <main className="editor">
          <header className="write-topbar">
            <div className="step-progress">
              <span>{progressLabel}</span>
              <div className="progress-track" aria-hidden="true">
                <div style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </header>

          {error ? <div className="error-banner">{error}</div> : null}

          <StepEditor
            activeStep={activeStep}
            completedCount={completedCount}
            draft={draft}
            goToStep={goToStep}
            saveDraft={saveDraft}
            selectedDate={selectedDate}
            saving={saving}
            setSelectedDate={setSelectedDate}
            slideDirection={slideDirection}
            updateDraft={updateDraft}
          />
        </main>
      ) : (
        <ReadPage
          entries={entries}
          error={error}
          loading={loading}
          onRefresh={fetchEntries}
          selectedReadId={selectedReadId}
          setSelectedReadId={setSelectedReadId}
        />
      )}
    </div>
  );
}

function StepEditor({
  activeStep,
  completedCount,
  draft,
  goToStep,
  saveDraft,
  selectedDate,
  saving,
  setSelectedDate,
  slideDirection,
  updateDraft,
}) {
  const isDateStep = activeStep === 0;
  const step = isDateStep ? null : diarySteps[activeStep - 1];
  const isFirst = activeStep === 0;
  const isLast = activeStep === totalFlowSteps - 1;

  return (
    <div className="step-workspace">
      <div className="slide-stage">
        <section
          className={`question-slide ${isDateStep ? 'date-slide' : ''} ${slideDirection}`}
          key={`${isDateStep ? 'date' : step.key}-${slideDirection}`}
        >
          {isDateStep ? (
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          ) : (
            <>
              <div className="slide-kicker">
                <span>{activeStep}</span>
                <strong>{step.sectionTitle}</strong>
              </div>

              <div className="question-block single-question">
                <p>
                  <span>Q{step.questionIndex + 1}</span>
                  {step.text}
                </p>
                <em>{step.prompt ?? step.sectionPrompt}</em>
              </div>

              <textarea
                autoFocus
                value={draft.answers?.[step.key] ?? ''}
                placeholder="마음속에 떠오르는 내용을 자유롭게 적어보세요."
                onChange={(event) => updateDraft(step.key, event.target.value)}
              />
            </>
          )}

          <div className={`slide-footer ${isDateStep ? 'date-footer' : ''}`}>
            <span>
              {isDateStep
                ? `${formatDate(selectedDate)} 기록`
                : `${completedCount}/${diarySteps.length} 답변`}
            </span>
            <div className="slide-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => goToStep(activeStep - 1)}
                disabled={isFirst}
              >
                <ChevronLeft size={18} />
                이전
              </button>
              {!isDateStep && !isLast ? (
                <button
                  className="secondary-button skip-button"
                  type="button"
                  onClick={() => goToStep(activeStep + 1)}
                >
                  스킵
                </button>
              ) : null}
              {isLast ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                >
                  {saving ? <RefreshCw className="spin" size={17} /> : <Save size={17} />}
                  저장
                </button>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => goToStep(activeStep + 1)}
                >
                  다음
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="step-dots" aria-label="단계 진행 상태">
        <button
          aria-label="날짜 선택"
          className={activeStep === 0 ? 'active' : ''}
          type="button"
          onClick={() => goToStep(0)}
        />
        {diarySteps.map((stepItem, index) => (
          <button
            aria-label={`${index + 1}번째 질문 ${stepItem.text}`}
            className={index + 1 === activeStep ? 'active' : ''}
            key={stepItem.key}
            type="button"
            onClick={() => goToStep(index + 1)}
          />
        ))}
      </div>
    </div>
  );
}

function DateSelector({ selectedDate, onDateChange }) {
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(selectedDate));

  useEffect(() => {
    setVisibleMonth(getMonthStart(selectedDate));
  }, [selectedDate]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  return (
    <div className="date-slide-content">
      <div className="question-block single-question date-question">
        <p>어느 날의 기록인가요?</p>
        <em>기본값은 오늘이에요. 다른 날을 기록하고 싶다면 날짜를 먼저 골라주세요.</em>
      </div>

      <section className="calendar-panel" aria-label="작성 날짜 선택">
        <header className="calendar-heading">
          <button
            aria-label="이전 달"
            className="calendar-nav-button"
            type="button"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
          >
            <ChevronLeft size={18} />
          </button>
          <strong>{monthLabel(visibleMonth)}</strong>
          <button
            aria-label="다음 달"
            className="calendar-nav-button"
            type="button"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </header>

        <div className="calendar-weekdays" aria-hidden="true">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day) => (
            <button
              className={[
                'calendar-day',
                day.isCurrentMonth ? '' : 'outside',
                day.key === selectedDate ? 'selected' : '',
                day.isToday ? 'today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={day.key}
              type="button"
              onClick={() => onDateChange(day.key)}
            >
              {day.label}
            </button>
          ))}
        </div>

        <label className="native-date-field" htmlFor="write-entry-date">
          <CalendarDays size={18} />
          <input
            id="write-entry-date"
            type="date"
            value={selectedDate}
            onChange={(event) => {
              if (event.target.value) {
                onDateChange(event.target.value);
              }
            }}
            aria-label="작성 날짜"
          />
        </label>
      </section>
    </div>
  );
}

function ReadPage({
  entries,
  error,
  loading,
  onRefresh,
  selectedReadId,
  setSelectedReadId,
}) {
  const selectedEntry =
    entries.find((entry) => entry.id === selectedReadId) ?? entries[0] ?? null;

  return (
    <main className="read-page">
      <header className="read-hero">
        <div>
          <span>MY ENTRIES</span>
          <h1>나의 일기</h1>
          <p>기록해 둔 하루를 다시 열어보고, 반복되는 감정과 배움을 조용히 살펴보세요.</p>
        </div>
        <button className="read-refresh" type="button" onClick={onRefresh}>
          <RefreshCw size={17} />
          새로고침
        </button>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="read-layout">
        <aside className="entry-rail" aria-label="저장된 일기 목록">
          {loading ? (
            <div className="read-empty">불러오는 중</div>
          ) : entries.length === 0 ? (
            <div className="read-empty">아직 저장된 일기가 없습니다.</div>
          ) : (
            entries.map((entry) => (
              <button
                className={entry.id === selectedEntry?.id ? 'read-entry active' : 'read-entry'}
                key={entry.id}
                type="button"
                onClick={() => setSelectedReadId(entry.id)}
              >
                <strong>{formatDate(entry.entry_date)}</strong>
                <span>{previewText(entry)}</span>
              </button>
            ))
          )}
        </aside>

        <article className="entry-reader">
          {selectedEntry ? (
            <>
              <div className="reader-heading">
                <span>{shortDate(selectedEntry.entry_date)}</span>
                <h2>{formatDate(selectedEntry.entry_date)} 통합 일기</h2>
              </div>

              <div className="reader-sections">
                {sections.map((section, index) => {
                  const text = composeSectionText(section, selectedEntry.answers);
                  return (
                    <section className="reader-section" key={section.key}>
                      <div>
                        <span>{index + 1}</span>
                        <h3>{section.title}</h3>
                      </div>
                      <p>{text || '아직 기록된 답변이 없습니다.'}</p>
                    </section>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="reader-placeholder">
              <h2>읽을 일기를 선택하세요</h2>
              <p>저장된 일기가 생기면 이곳에서 날짜별로 확인할 수 있어요.</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function ConfigMissing() {
  return (
    <main className="auth-screen">
      <div className="auth-panel">
        <h1>환경 설정 필요</h1>
        <p>
          `.env.example`을 복사해 `.env`를 만들고 Supabase URL과 anon key를 입력하세요.
        </p>
        <code>VITE_SUPABASE_URL</code>
        <code>VITE_SUPABASE_ANON_KEY</code>
      </div>
    </main>
  );
}

function normalizeEntry(entry) {
  const answers = normalizeAnswers(entry.answers, entry);

  return {
    id: entry.id ?? null,
    entry_date: entry.entry_date ?? todayKey(),
    answers,
    created_at: entry.created_at ?? null,
    updated_at: entry.updated_at ?? null,
  };
}

function toMarkdown(entry) {
  const sectionFields = composeSectionFields(entry.answers ?? {});

  return `# ${formatDate(entry.entry_date)} 통합 일기

## 1. 오늘의 일상
${markdownText(sectionFields.daily)}

## 2. 오늘의 감정
${markdownText(sectionFields.emotion)}

## 3. 오늘의 배움
${markdownText(sectionFields.learning)}

## 4. 오늘의 성장 포인트
${markdownText(sectionFields.growth)}

## 5. 내일의 작은 행동
${markdownText(sectionFields.action)}`;
}

function markdownText(value) {
  return value?.trim() ? value.trim() : '-';
}

function previewText(entry) {
  const sectionFields = composeSectionFields(entry.answers ?? {});
  const text = [
    sectionFields.action,
    sectionFields.growth,
    sectionFields.learning,
    sectionFields.emotion,
    sectionFields.daily,
  ]
    .find((value) => value?.trim());
  return text?.trim().replace(/\s+/g, ' ') ?? '아직 작성 전';
}

function emptyAnswers() {
  return Object.fromEntries(diarySteps.map((step) => [step.key, '']));
}

function normalizeAnswers(rawAnswers, entry) {
  const answers = emptyAnswers();
  const source =
    rawAnswers && typeof rawAnswers === 'object' && !Array.isArray(rawAnswers)
      ? rawAnswers
      : {};

  for (const step of diarySteps) {
    answers[step.key] = typeof source[step.key] === 'string' ? source[step.key] : '';
  }

  for (const section of sections) {
    const hasDetailedAnswer = section.questions.some((question) =>
      answers[question.key]?.trim(),
    );

    if (!hasDetailedAnswer && entry?.[section.key]?.trim()) {
      answers[section.questions[0].key] = entry[section.key];
    }
  }

  return answers;
}

function sanitizeAnswers(answers) {
  return Object.fromEntries(
    diarySteps.map((step) => [step.key, (answers?.[step.key] ?? '').trim()]),
  );
}

function composeSectionFields(answers) {
  return Object.fromEntries(
    sections.map((section) => [section.key, composeSectionText(section, answers)]),
  );
}

function composeSectionText(section, answers) {
  return section.questions
    .map((question, index) => {
      const answer = answers?.[question.key]?.trim();
      if (!answer) return '';
      return `${index + 1}. ${question.text}\n${answer}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function uniqueByDate(entry, index, source) {
  return source.findIndex((candidate) => candidate.entry_date === entry.entry_date) === index;
}

function latestFirst(a, b) {
  return b.entry_date.localeCompare(a.entry_date);
}

function todayKey() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function parseDateKey(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthStart(value) {
  const date = typeof value === 'string' ? parseDateKey(value) : value;
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function buildCalendarDays(monthDate) {
  const monthStart = getMonthStart(monthDate);
  const gridStart = new Date(monthStart);
  const today = todayKey();

  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const key = dateKeyFromDate(date);

    return {
      key,
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: key === today,
    };
  });
}

function monthLabel(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatDate(value) {
  const [year, month, day] = value.split('-');
  return `${year}년 ${month}월 ${day}일`;
}

function shortDate(value) {
  const [year, month, day] = value.split('-');
  return `${year}.${month}.${day}`;
}

createRoot(document.getElementById('root')).render(<App />);
