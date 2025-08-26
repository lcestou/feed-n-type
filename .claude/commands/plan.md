---
description: Strategic planning with PRDs, architecture docs, and product strategy
allowed-tools: Task
argument-hint: '[planning type: prd|architecture|strategy|research]'
---

Create Product Requirements Documents, architecture plans, and strategic analysis

**CRITICAL**: Agent must use TodoWrite tool to track planning progress and keep user informed

## Usage

- `/plan prd multiplayer feature` - Create PRD for new feature development
- `/plan architecture mobile app` - Design system architecture and technical specs
- `/plan strategy user retention` - Analyze and plan product strategy
- `/plan research competitor analysis` - Market research and competitive intelligence

## What it does

1. **Requirements Gathering**: Analyzes needs and defines objectives
2. **Strategic Analysis**: Market research and competitive positioning
3. **Documentation Creation**: PRDs, technical specs, architecture diagrams
4. **Planning Framework**: Uses proven methodologies (RICE, MoSCoW, etc.)
5. **Stakeholder Alignment**: Clear communication and decision frameworks
6. **Quality Gates**: Runs `pnpm format && pnpm lint && pnpm check && pnpm build` before completion

**Progress Tracking**: Agent updates todo showing research completed and documents created

## Planning Types

### Product Requirements Documents (PRDs)

- **Structure**: Problem statement, goals, user stories, acceptance criteria
- **Methodology**: Jobs-to-be-Done framework, user journey mapping
- **Templates**: Feature PRDs, epic planning, release documentation
- **Output Location**: `/docs/prds/` directory (created as needed)

### Architecture Planning

- **System Design**: Component architecture, data flow, technical decisions
- **Scalability**: Performance requirements, growth planning
- **Integration**: Third-party services, API design, database schema
- **Output Location**: `/docs/architecture/` directory (created as needed)

### Product Strategy

- **Market Analysis**: Competitor research, user needs assessment
- **Prioritization**: RICE scoring, impact/effort matrices
- **Roadmap Planning**: Feature sequencing, timeline estimation
- **Output Location**: `/docs/strategy/` directory (created as needed)

## Gaming-Specific Planning

- **User Experience**: Kid-friendly design, accessibility requirements
- **Educational Value**: Learning objectives, skill progression
- **Engagement**: Gamification mechanics, reward systems
- **Safety**: Child protection, content moderation, privacy compliance
- **Monetization**: Ethical approaches for educational games

## Document Standards

- **Markdown Format**: Consistent formatting and structure
- **Version Control**: Git-tracked documents with change history
- **Cross-references**: Links between related documents and code
- **Regular Updates**: Living documents that evolve with development
- **Stakeholder Review**: Clear approval processes and decision tracking

## Best suited for

- Planning major features before development
- System architecture decisions and documentation
- Product strategy and competitive analysis
- User research synthesis and planning
- Technical decision documentation
- Release planning and milestone setting

**Tip**: Specify document type and scope like "prd for user profiles" or "architecture for real-time multiplayer"
