'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  Code2,
  ShieldCheck,
  Bug,
  Lock,
  Terminal,
  HelpCircle,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Flame,
  Star,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { COURSES } from '@/lib/courses-data';
import { Course, Lesson, NavTab } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

interface AcademyViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenPracticeChallenge?: (challengeId: string) => void;
}

export const AcademyView: React.FC<AcademyViewProps> = ({
  onNavigate,
  onOpenPracticeChallenge,
}) => {
  const { user } = useAuth();

  // State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  // Progress state persisted in localStorage
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [userXp, setUserXp] = useState<number>(320);
  const [streakDays, setStreakDays] = useState<number>(4);

  // Quiz state for active lesson
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  // Certificate Modal state
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const savedCompleted = localStorage.getItem('repopilot_completed_lessons');
      if (savedCompleted) {
        setCompletedLessons(JSON.parse(savedCompleted));
      }
      const savedXp = localStorage.getItem('repopilot_user_xp');
      if (savedXp) {
        setUserXp(parseInt(savedXp, 10));
      }
    } catch {
      // Local storage fallback
    }
  }, []);

  const saveProgress = (newCompleted: Record<string, boolean>, addedXp: number = 0) => {
    setCompletedLessons(newCompleted);
    const newXp = userXp + addedXp;
    setUserXp(newXp);
    try {
      localStorage.setItem('repopilot_completed_lessons', JSON.stringify(newCompleted));
      localStorage.setItem('repopilot_user_xp', String(newXp));
    } catch {
      // ignore
    }
  };

  const selectedCourse = COURSES.find((c) => c.id === selectedCourseId);

  // Get active lesson
  let activeLesson: Lesson | null = null;
  if (selectedCourse) {
    for (const module of selectedCourse.modules) {
      const found = module.lessons.find((l) => l.id === activeLessonId);
      if (found) {
        activeLesson = found;
        break;
      }
    }
    // Default to first lesson if not selected
    if (!activeLesson && selectedCourse.modules[0]?.lessons[0]) {
      activeLesson = selectedCourse.modules[0].lessons[0];
    }
  }

  // Calculate course completion percentage
  const getCourseProgress = (course: Course) => {
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    if (totalLessons === 0) return 0;
    const completedCount = course.modules.reduce((acc, m) => {
      return acc + m.lessons.filter((l) => completedLessons[l.id]).length;
    }, 0);
    return Math.round((completedCount / totalLessons) * 100);
  };

  const handleStartCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    const course = COURSES.find((c) => c.id === courseId);
    if (course && course.modules[0]?.lessons[0]) {
      setActiveLessonId(course.modules[0].lessons[0].id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteLesson = (lessonId: string, xpReward: number = 50) => {
    if (!completedLessons[lessonId]) {
      const updated = { ...completedLessons, [lessonId]: true };
      saveProgress(updated, xpReward);

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }

      // Check if course is now 100% complete
      if (selectedCourse) {
        const progress = getCourseProgress(selectedCourse);
        if (progress >= 95) {
          setTimeout(() => {
            setIsCertificateOpen(true);
            try {
              confetti({
                particleCount: 120,
                spread: 90,
                origin: { y: 0.6 },
              });
            } catch {
              // ignore
            }
          }, 600);
        }
      }
    }
  };

  const handleLaunchPractice = (challengeId: string) => {
    if (onOpenPracticeChallenge) {
      onOpenPracticeChallenge(challengeId);
    }
    onNavigate('practice');
  };

  // Filter courses
  const filteredCourses = COURSES.filter((course) => {
    const matchesCategory =
      selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.skillsGained.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesLevel && matchesSearch;
  });

  const categories = [
    'All',
    'Debugging & Errors',
    'Security & Auth',
    'Python & Algorithms',
    'React & Architecture',
  ];

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Platform Header & Stats Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-7 md:p-9 shadow-lg border border-indigo-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>RepoPilot Learning Academy & Course Platform</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
              Master Modern Engineering, Debugging & Security
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Interactive video-free, hands-on courses designed to teach you the deep mental models
              behind code execution, runtime errors, and rock-solid defense.
            </p>
          </div>

          {/* Gamification Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3 shadow-inner">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs text-slate-300 font-medium">Daily Streak</div>
                <div className="text-lg font-bold text-white">{streakDays} Days 🔥</div>
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3 shadow-inner">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-300 font-medium">Knowledge XP</div>
                <div className="text-lg font-bold text-cyan-300">{userXp} XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main View: Either Course Catalog OR Active Course Syllabus/Player */}
      {!selectedCourseId ? (
        // ==========================================
        // 1. COURSE CATALOG VIEW
        // ==========================================
        <div className="space-y-6">
          {/* Filters & Search Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses, skills, or error concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Banner Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 md:p-8 shadow-md">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/20 backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                RECOMMENDED TRACK
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Mastering JavaScript & TypeScript Debugging
              </h2>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Connects directly to our Code Practice Space with automated AI Error Explanation!
                Learn Call Stack internals, eliminate undefined exceptions, and master async error
                resilience.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleStartCourse('js-ts-debugging')}
                  className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-indigo-700" />
                  <span>Start Course Now</span>
                </button>
                <button
                  onClick={() => handleLaunchPractice('type-error-null')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Jump to Practice Lab</span>
                </button>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const progress = getCourseProgress(course);
              const totalLessons = course.modules.reduce((a, b) => a + b.lessons.length, 0);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Strip */}
                    <div
                      className={`h-3 bg-gradient-to-r ${course.color || 'from-indigo-500 to-cyan-500'}`}
                    />
                    <div className="p-6 space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          {course.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{course.duration}</span>
                        </div>
                      </div>

                      {/* Title & Tagline */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {course.tagline}
                        </p>
                      </div>

                      {/* Skills gained pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {course.skillsGained.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span>Progress</span>
                          <span className="font-bold text-slate-700">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{totalLessons} Lessons</span>
                    </div>

                    <button
                      onClick={() => handleStartCourse(course.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{progress > 0 ? 'Continue' : 'Start Course'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // ==========================================
        // 2. ACTIVE COURSE SYLLABUS & LESSON READER
        // ==========================================
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <button
                onClick={() => setSelectedCourseId(null)}
                className="hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
              >
                All Courses
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 truncate max-w-xs">
                {selectedCourse?.title}
              </span>
              {activeLesson && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-indigo-600 font-semibold truncate max-w-xs">
                    {activeLesson.title}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => setSelectedCourseId(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Back to Catalog
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Syllabus & Module Tree (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6 sticky top-20">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {selectedCourse?.category}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    +{selectedCourse?.xp} XP Total
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{selectedCourse?.title}</h2>
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Course Completion</span>
                    <span className="font-bold text-slate-800">
                      {selectedCourse ? getCourseProgress(selectedCourse) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{
                        width: `${selectedCourse ? getCourseProgress(selectedCourse) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Modules list */}
              <div className="space-y-5 pt-2 border-t border-slate-100">
                {selectedCourse?.modules.map((module, mIdx) => (
                  <div key={module.id} className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-extrabold">
                        {mIdx + 1}
                      </span>
                      <span>{module.title}</span>
                    </div>

                    <div className="space-y-1 pl-6">
                      {module.lessons.map((lesson) => {
                        const isCurrent = activeLesson?.id === lesson.id;
                        const isCompleted = completedLessons[lesson.id];

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLessonId(lesson.id)}
                            className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between group cursor-pointer ${
                              isCurrent
                                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : isCurrent ? (
                                <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600 shrink-0" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0 group-hover:bg-slate-400" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>

                            <span className="text-[10px] text-slate-400 shrink-0">
                              {lesson.durationMinutes}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Active Lesson Reader & Interactive Lab (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {activeLesson ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
                  {/* Lesson Header */}
                  <div className="border-b border-slate-100 pb-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          {activeLesson.type === 'interactive_lab'
                            ? '⚡ Interactive Lab'
                            : '📖 Concept Lesson'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{activeLesson.durationMinutes} min read</span>
                        </span>
                      </div>

                      {completedLessons[activeLesson.id] && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed (+50 XP)</span>
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {activeLesson.title}
                    </h1>

                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      {activeLesson.summary}
                    </p>
                  </div>

                  {/* Lesson Body Paragraphs */}
                  <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
                    {activeLesson.content.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Key Takeaways Callout Card */}
                  {activeLesson.keyTakeaways && activeLesson.keyTakeaways.length > 0 && (
                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Core Mental Model & Key Takeaways</span>
                      </div>
                      <ul className="space-y-1.5 pl-5 list-disc text-xs text-indigo-950 font-medium">
                        {activeLesson.keyTakeaways.map((takeaway, tIdx) => (
                          <li key={tIdx}>{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Code Example Widget */}
                  {activeLesson.codeExample && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Code2 className="w-4 h-4 text-indigo-600" />
                          <span>{activeLesson.codeExample.description}</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {activeLesson.codeExample.language}
                        </span>
                      </div>

                      <div className="rounded-xl overflow-hidden bg-slate-950 text-slate-100 border border-slate-800 p-4 font-mono text-xs shadow-inner">
                        <pre className="overflow-x-auto leading-relaxed">
                          <code>{activeLesson.codeExample.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Interactive Code Lab Callout (If lesson has attached practice challenge) */}
                  {activeLesson.practiceChallengeId && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white space-y-3 shadow-md border border-indigo-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-cyan-400">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">
                              Hands-On Error Diagnostic Lab
                            </h4>
                            <p className="text-xs text-slate-300">
                              Practice fixing this exact error in our interactive playground with AI
                              Tutor guidance!
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLaunchPractice(activeLesson!.practiceChallengeId!)}
                          className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <span>Open in Code Lab</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive Quiz / Knowledge Check */}
                  {activeLesson.quiz && activeLesson.quiz.length > 0 && (
                    <div className="border-t border-slate-100 pt-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Quick Knowledge Check (Concept Verification)
                        </h3>
                      </div>

                      {activeLesson.quiz.map((q) => {
                        const selectedIdx = quizAnswers[q.id];
                        const isSubmitted = quizSubmitted[q.id];
                        const isCorrect = selectedIdx === q.correctIndex;

                        return (
                          <div
                            key={q.id}
                            className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                          >
                            <p className="text-sm font-semibold text-slate-800">{q.question}</p>

                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => {
                                const isOptionSelected = selectedIdx === optIdx;

                                return (
                                  <button
                                    key={optIdx}
                                    disabled={isSubmitted}
                                    onClick={() =>
                                      setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })
                                    }
                                    className={`w-full text-left p-3 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                      isSubmitted && optIdx === q.correctIndex
                                        ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500 font-bold'
                                        : isSubmitted && isOptionSelected && !isCorrect
                                          ? 'bg-rose-50 text-rose-800 border-2 border-rose-500'
                                          : isOptionSelected
                                            ? 'bg-indigo-50 text-indigo-900 border-2 border-indigo-500 font-semibold'
                                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {isSubmitted && optIdx === q.correctIndex && (
                                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                    )}
                                    {isSubmitted && isOptionSelected && !isCorrect && (
                                      <X className="w-4 h-4 text-rose-600 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Submit Quiz Answer Button */}
                            {!isSubmitted ? (
                              <button
                                disabled={selectedIdx === undefined}
                                onClick={() =>
                                  setQuizSubmitted({ ...quizSubmitted, [q.id]: true })
                                }
                                className="px-4 py-1.5 rounded-lg bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                              >
                                Check Answer
                              </button>
                            ) : (
                              <div
                                className={`p-3 rounded-lg text-xs ${
                                  isCorrect
                                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                                }`}
                              >
                                <div className="font-bold mb-1">
                                  {isCorrect ? '🎉 Correct Concept!' : '💡 Conceptual Explanation:'}
                                </div>
                                <p>{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Completion and Next Lesson Footer Bar */}
                  <div className="border-t border-slate-100 pt-6 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => handleCompleteLesson(activeLesson!.id, 50)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                        completedLessons[activeLesson.id]
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {completedLessons[activeLesson.id]
                          ? 'Completed (Click to Re-celebrate)'
                          : 'Mark as Completed (+50 XP)'}
                      </span>
                    </button>

                    {/* Next Lesson Button */}
                    <button
                      onClick={() => {
                        handleCompleteLesson(activeLesson!.id, 50);
                        // Find next lesson
                        if (selectedCourse) {
                          const allLessons = selectedCourse.modules.flatMap((m) => m.lessons);
                          const currentIndex = allLessons.findIndex(
                            (l) => l.id === activeLesson!.id
                          );
                          if (currentIndex < allLessons.length - 1) {
                            setActiveLessonId(allLessons[currentIndex + 1].id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Lesson</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Course Completion Digital Certificate Modal */}
      {isCertificateOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-indigo-200 p-8 shadow-2xl relative text-center space-y-6">
            <button
              onClick={() => setIsCertificateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                Official Certificate of Mastery
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Congratulations, {user?.name || 'Engineer'}!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You have successfully completed all conceptual modules, diagnostic labs, and knowledge
                verifications for:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 text-sm">
                {selectedCourse.title}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-around text-xs font-semibold text-slate-700">
              <div>
                <div className="text-slate-400 font-medium">Credential ID</div>
                <div className="font-mono text-indigo-700">RP-CERT-8849</div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <div className="text-slate-400 font-medium">XP Awarded</div>
                <div className="font-bold text-emerald-600">+{selectedCourse.xp} XP</div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <div className="text-slate-400 font-medium">Issued Date</div>
                <div>{new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsCertificateOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Claim & Continue Learning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
