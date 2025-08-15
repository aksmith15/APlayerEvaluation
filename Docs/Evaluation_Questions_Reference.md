# Evaluation Questions Reference

**Last Updated:** February 1, 2025  
**Survey Implementation Status:** ✅ Complete - All 10 attributes implemented  
**Source:** `a-player-dashboard/src/components/ui/EvaluationSurvey.tsx`

---

## 📋 **Overview**

This document contains the complete reference for all evaluation survey questions used in the A-Player Evaluations system. The survey implements a comprehensive 10-attribute assessment with conditional question logic based on scoring ranges.

### **10 Core Attributes:**
1. **Reliability** - Consistency in delivery and follow-through
2. **Accountability for Action** - Taking ownership and responsibility  
3. **Quality of Work** - Standards and excellence in output
4. **Taking Initiative** - Proactive behavior and leadership
5. **Adaptability** - Flexibility and change management
6. **Problem Solving Ability** - Analytical and creative solutions
7. **Teamwork** - Collaboration and team effectiveness
8. **Continuous Improvement** - Growth mindset and learning
9. **Communication Skills** - Clear and effective communication
10. **Leadership** - Influence and guidance capabilities

---

## 🎯 **Scoring System**

### **Scale Anchor Points:**
- **10** - Exceptional performance (top 5% of professionals)
- **7** - Good performance (meets expectations well)
- **5** - Below expectation (needs improvement)
- **1** - Poor performance (critical issues)

### **Conditional Question Logic:**
- **Score 9-10:** Excellence questions - systems, leadership readiness, organizational impact
- **Score 6-8:** Development questions - strengths, challenges, improvement areas
- **Score 1-5:** Improvement questions - gaps, support needs, development plans

---

## 📝 **Complete Attribute Definitions & Questions**

### **1. RELIABILITY**

**Definition:** The degree to which someone consistently shows up, follows through, and can be counted on to deliver as promised—even under stress or without supervision.

#### **Scale Descriptions:**
- **Exceptional (10):** Always early or on time, never needs reminders, proactively communicates if delays are possible, follows through 100% of the time. Trusted with mission-critical responsibilities.
- **Good (7):** Delivers on time and meets commitments. Occasional lapses in punctuality or communication, but not impactful.
- **Below Expectation (5):** Noticeably inconsistent. Frequently late or fails to follow through. Causes team friction or requires consistent monitoring.
- **Poor (1):** Fundamentally unreliable in role. Cannot be relied on for basic responsibilities. Undermines team performance.

#### **Base Questions (All Evaluations):**

**Q1. Commitment Follow-Through**  
*When this person makes a commitment, how often do they follow through completely?*
- Always delivers on commitments, often ahead of schedule
- Usually delivers with occasional minor delays or adjustments
- Sometimes delivers but often needs reminders or support
- Frequently fails to deliver or delivers incomplete work
- Consistently unreliable with commitments

**Q2. Communication Proactivity**  
*How do they communicate when issues might affect their commitments?*
- Proactively communicates potential issues early with solutions
- Usually gives advance notice when problems arise
- Sometimes communicates issues but often at the last minute
- Rarely communicates problems until asked directly
- Consistently fails to communicate issues affecting commitments

#### **Conditional Questions:**

**For Scores 9-10 (Excellence):**
1. **Excellence Systems** (Multi-select, max 2): What are the top two systems or methods this person uses to ensure their exceptional reliability?
2. **Pressure Performance**: How does this person typically respond when under pressure?
3. **Teaching Others**: How does this person support others in being more reliable?
4. **Excellence Example** (Text): Describe one specific situation that best demonstrates why you rated their reliability this high.
5. **Leadership Readiness**: How ready is this person for greater responsibility based on their reliability?
6. **Organizational Impact**: What effect does this person's reliability have on the rest of the team?

**For Scores 6-8 (Development):**
1. **Success Situations** (Multi-select, max 2): In what types of situations does this person perform most reliably?
2. **Struggle Situations** (Multi-select, max 2): What types of situations seem to challenge their reliability the most?
3. **Workload Impact**: How does this person's reliability change depending on their workload?
4. **Consistency Pattern**: What is the most common pattern you see in their reliability over time?
5. **Development Priority**: What would most help this person become more consistently reliable?

**For Scores 1-5 (Improvement):**
1. **Primary Challenges** (Multi-select, max 2): What are the main reliability challenges you've observed with this person?
2. **Impact on Others**: How do their reliability issues affect team performance?
3. **Support Systems**: What type of support or system would most likely help them improve?
4. **Improvement Potential** (Text): What gives you the most confidence that this person can improve their reliability?

---

### **2. ACCOUNTABILITY FOR ACTION**

**Definition:** The degree to which someone takes ownership of their work, decisions, and their impact on others, including acknowledging mistakes and actively working to resolve issues.

#### **Scale Descriptions:**
- **Exceptional (10):** Takes full ownership of outcomes, immediately acknowledges mistakes, proactively addresses problems, and helps others take ownership too.
- **Good (7):** Generally owns their work and decisions. May need gentle prompting to acknowledge some mistakes but responds well.
- **Below Expectation (5):** Inconsistent ownership. Sometimes deflects responsibility or needs significant encouragement to acknowledge problems.
- **Poor (1):** Consistently avoids responsibility, blames others, makes excuses, and shows no commitment to resolving issues they've created.

#### **Base Questions:**

**Q1. Ownership of Outcomes**  
*When something doesn't go as planned in their work, how does this person typically respond?*
- Immediately takes ownership and focuses on solutions
- Usually owns the issue after brief discussion
- Sometimes takes ownership but often needs encouragement
- Tends to focus on external factors rather than their role
- Consistently avoids taking responsibility

**Q2. Mistake Acknowledgment**  
*How does this person handle situations where they've made an error?*
- Proactively identifies and reports their own mistakes
- Acknowledges mistakes when pointed out and acts quickly to fix them
- Eventually acknowledges mistakes but may be defensive initially
- Reluctant to admit errors, often needs multiple conversations
- Consistently denies or minimizes their mistakes

#### **Conditional Questions:** [Similar structure for scores 9-10, 6-8, 1-5]

---

### **3. QUALITY OF WORK**

**Definition:** The degree to which someone's work output meets or exceeds standards for accuracy, completeness, usability, and professional presentation.

#### **Scale Descriptions:**
- **Exceptional (10):** Work consistently exceeds expectations. Others use their output as the standard. Rare errors that are self-caught.
- **Good (7):** Work reliably meets expectations with occasional minor issues that don't impact usability.
- **Below Expectation (5):** Work often needs revision. Noticeable errors or omissions that impact others' ability to use the output.
- **Poor (1):** Work consistently falls short. Frequent errors, incomplete deliverables, or output that creates more work for others.

#### **Base Questions:**

**Q1. Work Standards**  
*How would you describe the typical quality of this person's work output?*
- Consistently exceeds quality expectations
- Usually meets quality expectations with minor exceptions
- Sometimes meets expectations but often requires revision
- Frequently requires significant revision or correction
- Consistently produces substandard work

**Q2. Error Pattern**  
*When this person does make errors in their work, what is the typical pattern?*
- Rare errors that they catch and fix themselves
- Occasional minor errors that are easy to fix
- Regular errors that require feedback to identify
- Frequent errors that impact the usability of their work
- Systematic errors that suggest fundamental misunderstanding

#### **Conditional Questions:** [Similar structure continues...]

---

### **4. TAKING INITIATIVE**

**Definition:** The degree to which someone identifies opportunities or problems and takes action without being asked, directed, or prompted by others.

#### **Scale Descriptions:**
- **Exceptional (10):** Consistently identifies and acts on opportunities before others see them. Creates value through proactive action.
- **Good (7):** Regularly takes initiative when opportunities are clear. Comfortable acting independently within their role.
- **Below Expectation (5):** Occasionally takes initiative but usually waits for direction or clear prompting from others.
- **Poor (1):** Rarely acts without explicit direction. May actually resist or oppose others' initiative-taking.

#### **Base Questions:**

**Q1. Initiative Frequency**  
*In your experience with this person, how frequently do they act without being asked?*
- Consistently takes ownership and steps in proactively
- Often takes initiative, especially when comfortable with the context
- Occasionally steps up but usually waits for direction
- Rarely takes initiative, even when opportunities are clear
- Not sure / haven't observed

**Q2. Initiative Style** (Multi-select, max 2)  
*When they do take initiative, what best describes their style?*
- Problem-solver: fixes things before they break
- Builder: creates or improves systems, tools, or processes
- Helper: supports others without being prompted
- Challenger: questions assumptions to create value
- Opportunist: spots and seizes new openings
- Not sure / haven't observed

**Q3. Initiative Example** (Text)  
*Share an example of when this person took initiative.*

---

### **5. ADAPTABILITY**

**Definition:** The degree to which someone adjusts their approach, learning, and behavior when circumstances change, new information emerges, or different methods are required.

#### **Scale Descriptions:**
- **Exceptional (10):** Thrives in changing environments. Quickly learns new approaches and helps others adapt effectively.
- **Good (7):** Handles changes well with some adjustment time. Open to new approaches and feedback.
- **Below Expectation (5):** Struggles with changes. Requires significant support to adjust to new circumstances or methods.
- **Poor (1):** Resists change or becomes ineffective when routines are disrupted. Creates friction during transitions.

[Continues with base questions and conditional logic...]

---

### **6. PROBLEM SOLVING ABILITY**

**Definition:** The degree to which someone can analyze situations, identify root causes, generate effective solutions, and implement them successfully.

[Full definition and questions structure...]

---

### **7. TEAMWORK**

**Definition:** The degree to which someone contributes positively to group efforts, supports colleagues, and helps the team achieve collective goals.

[Full definition and questions structure...]

---

### **8. CONTINUOUS IMPROVEMENT**

**Definition:** The degree to which someone actively seeks to learn, grow, and enhance their capabilities, processes, and results over time.

[Full definition and questions structure...]

---

### **9. COMMUNICATION SKILLS**

**Definition:** The degree to which someone clearly expresses ideas, actively listens, and facilitates understanding in both verbal and written interactions.

[Full definition and questions structure...]

---

### **10. LEADERSHIP**

**Definition:** The degree to which someone can influence, guide, and inspire others toward achieving goals, whether in formal or informal leadership situations.

#### **Scale Descriptions:**
- **Exceptional (10):** Naturally inspires and guides others. People seek their direction and follow their lead. Creates positive change.
- **Good (7):** Shows leadership qualities in familiar situations. Others respect their input and guidance.
- **Below Expectation (5):** Limited leadership impact. May lead in very specific situations but doesn't influence broader outcomes.
- **Poor (1):** Negative leadership impact. Others avoid following their lead or their influence creates problems.

#### **Base Questions:**

**Q1. Leadership Recognition**  
*How do others typically respond to this person's input or guidance?*
- People actively seek their direction and follow their lead
- Others generally respect and consider their input
- Some people listen, but influence is limited to specific areas
- Others rarely turn to them for guidance or direction
- People tend to ignore or avoid their input

**Q2. Leadership Situations** (Multi-select, max 2)  
*In what situations have you seen this person show the strongest leadership? (select top 2)*
- During crisis or high-pressure situations
- When launching new initiatives or projects
- While mentoring or developing others
- In cross-functional or collaborative work
- When advocating for important changes or improvements
- I haven't observed them in leadership situations

[Continues with conditional questions for each score range...]

---

## 🔧 **Question Types**

### **Single Select**
- Radio button selection
- One answer required
- Used for most assessment questions

### **Multi Select** 
- Checkbox selection
- Maximum selections specified (usually 2)
- Used for identifying multiple factors or approaches

### **Text**
- Open-ended response
- Required or optional
- Used for examples and detailed feedback

---

## 📊 **Implementation Notes**

### **Survey Flow:**
1. **Base Questions** - Asked for every attribute regardless of score
2. **Scoring Phase** - 1-10 scale with detailed descriptions
3. **Conditional Questions** - Based on score range (9-10, 6-8, 1-5)
4. **Progress Tracking** - Visual indicators and completion status

### **Scoring Logic:**
- Base questions inform the evaluator
- Score determines conditional question set
- All responses stored in `attribute_responses` table
- Calculated scores stored in `attribute_scores` table

### **Data Structure:**
```javascript
// Question Structure
{
  id: 'unique_question_identifier',
  attribute_name: 'Attribute Name',
  question_text: 'The actual question text',
  question_type: 'single_select' | 'multi_select' | 'text',
  is_required: boolean,
  options?: string[], // For select questions
  max_selections?: number, // For multi_select
  placeholder?: string, // For text questions
  order: number
}
```

---

## ⚠️ **Important Notes for Developers**

### **When Modifying Survey Questions:**
1. **Check this document first** for current question structure
2. **Update this document** when making changes to questions
3. **Test conditional logic** thoroughly - score ranges trigger different question sets
4. **Consider data migration** if changing question IDs or structure
5. **Verify scoring calculations** still work with question changes

### **Question ID Naming Convention:**
`{attribute_name}_{question_purpose}_{specific_aspect}`

Examples:
- `reliability_commitment_follow_through`
- `leadership_excellence_systems`
- `teamwork_struggle_situations`

### **Database Integration:**
- Questions stored as JSON in application code
- Responses stored in `attribute_responses` table
- Question IDs must remain consistent for historical data integrity
- Score calculations depend on question structure

---

**🔗 Related Documentation:**
- [Supabase_Database_Structure.md](./Supabase_Database_Structure.md) - Database schema for survey responses
- [Implementation.md](./Implementation.md) - Current development tasks
- [Bug_tracking.md](./Bug_tracking.md) - Known survey issues
