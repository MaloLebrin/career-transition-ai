import { StyleSheet } from '@react-pdf/renderer'

// ─── palette ──────────────────────────────────────────────────────────────────

export const C = {
  primary: '#7c3aed',
  primaryDark: '#5b21b6',
  primaryBg: '#ede9fe',
  primaryBorder: '#c4b5fd',
  dark: '#111827',
  medium: '#374151',
  gray: '#6b7280',
  lightGray: '#e5e7eb',
  superLight: '#f9fafb',
  white: '#ffffff',
  green: '#059669',
  greenBg: '#d1fae5',
  amber: '#d97706',
  amberBg: '#fef3c7',
  red: '#dc2626',
  redBg: '#fee2e2',
} as const

export const PAGE_PAD = 40

// ─── stylesheet ───────────────────────────────────────────────────────────────

export const s = StyleSheet.create({
  // page
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.dark,
    backgroundColor: C.white,
    paddingHorizontal: PAGE_PAD,
    paddingTop: PAGE_PAD,
    paddingBottom: 56,
  },

  // ── page header (purple band)
  pageHeader: {
    backgroundColor: C.primaryBg,
    marginHorizontal: -PAGE_PAD,
    marginTop: -PAGE_PAD,
    paddingHorizontal: PAGE_PAD,
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 28,
  },
  pageHeaderEyebrow: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    letterSpacing: 2,
    marginBottom: 10,
  },
  pageHeaderName: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.primaryDark,
    marginBottom: 6,
  },
  pageHeaderRoleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pageHeaderRole: {
    fontSize: 12,
    color: C.medium,
    flex: 1,
  },
  pageHeaderDate: {
    fontSize: 9,
    color: C.gray,
  },
  pageHeaderEmail: {
    fontSize: 9,
    color: C.gray,
    marginTop: 6,
  },

  // ── section
  sectionBlock: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 12,
  },

  // ── card (white with border)
  card: {
    backgroundColor: C.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.lightGray,
    padding: 16,
    marginBottom: 8,
  },

  // ── sub-label (bold + underline, like in reference PDF)
  subLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    textDecoration: 'underline',
    marginBottom: 4,
  },
  subLabelPlain: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 4,
  },

  // ── body text
  body: {
    fontSize: 10,
    color: C.medium,
    lineHeight: 1.6,
  },
  bodySmall: {
    fontSize: 9,
    color: C.gray,
    lineHeight: 1.5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },

  // ── highlight (résumé exécutif / expert message)
  highlight: {
    backgroundColor: C.primaryBg,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  highlightText: {
    fontSize: 10,
    color: C.medium,
    lineHeight: 1.7,
  },

  // ── profile card
  profileName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 10,
    color: C.medium,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 9,
    color: C.gray,
    marginBottom: 10,
  },
  profileDivider: {
    borderTopWidth: 1,
    borderTopColor: C.lightGray,
    marginVertical: 8,
  },
  profileSummary: {
    fontSize: 10,
    color: C.medium,
    lineHeight: 1.6,
  },

  // ── skill row
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.lightGray,
  },
  skillName: {
    fontSize: 10,
    color: C.medium,
    flex: 1,
  },
  skillDots: {
    flexDirection: 'row',
    gap: 3,
  },

  // ── exercise card
  exerciseCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseCardHeader: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCardTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  exerciseTypePill: {
    backgroundColor: C.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  exerciseTypePillText: {
    fontSize: 8,
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  exerciseCardBody: {
    backgroundColor: C.white,
    padding: 14,
  },
  exerciseMeta: {
    fontSize: 9,
    color: C.gray,
    marginBottom: 10,
  },

  // ── score block
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    backgroundColor: C.superLight,
    borderRadius: 6,
    padding: 10,
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  scoreDivider: {
    fontSize: 10,
    color: C.gray,
  },
  scoreMax: {
    fontSize: 14,
    color: C.gray,
    fontFamily: 'Helvetica-Bold',
  },
  scoreRight: {
    flex: 1,
  },
  scoreBarTrack: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
  },
  scoreBarLabel: {
    fontSize: 8,
    color: C.gray,
  },

  // ── analysis box
  analysisBox: {
    backgroundColor: C.superLight,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: C.lightGray,
  },
  analysisEyebrow: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  analysisText: {
    fontSize: 9,
    color: C.medium,
    lineHeight: 1.7,
  },

  // ── plan step
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    backgroundColor: C.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.lightGray,
    padding: 12,
  },
  stepIconCol: {
    alignItems: 'center',
    width: 24,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.greenBg,
    borderWidth: 2,
    borderColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 3,
  },
  stepMeta: {
    fontSize: 9,
    color: C.gray,
    marginBottom: 3,
  },
  stepNotes: {
    fontSize: 9,
    color: C.medium,
    lineHeight: 1.5,
  },
  completedBadge: {
    backgroundColor: C.greenBg,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  completedBadgeText: {
    fontSize: 8,
    color: C.green,
    fontFamily: 'Helvetica-Bold',
  },

  // ── footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: PAGE_PAD,
    right: PAGE_PAD,
  },
  footerLine: {
    borderTopWidth: 0.5,
    borderTopColor: C.lightGray,
    marginBottom: 5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: C.gray,
  },
})
