# ACCESS_DATABASE_SCHEMA.md

# ACCESS Database Schema
## Version 1.0

### Purpose

This document translates the ACCESS doctrine, registry architecture, graph architecture, and object model into a software-ready database design.

This is the first implementation layer.

---

# Design Principle

The database exists to manage:

- Identity
- Ownership
- Relationships
- Systems
- Assets
- Projects
- Knowledge
- Connections

The database does not exist merely to store files.

The database exists to represent value.

---

# Core Tables

## identities

Purpose:
Root ownership object.

Fields:

- id (UUID)
- access_id
- username
- display_name
- email
- created_at
- updated_at
- status

Example:

jerry.access

---

## organizations

Purpose:
Groups of people and systems.

Fields:

- id
- owner_identity_id
- name
- description
- created_at

Examples:

- JD AI Systems
- JD Productions

---

## worlds

Purpose:
Domains of participation.

Fields:

- id
- name
- description
- category

Examples:

- Finance World
- Business World
- AI World

---

## systems

Purpose:
Repeatable structures.

Fields:

- id
- owner_identity_id
- organization_id
- name
- description
- world_id
- status

---

## projects

Purpose:
Temporary initiatives.

Fields:

- id
- owner_identity_id
- system_id
- name
- description
- status
- start_date
- target_date

---

## assets

Purpose:
Future value producers.

Fields:

- id
- owner_identity_id
- organization_id
- asset_type
- name
- description
- value_score
- status

Examples:

- Website
- Domain
- Business
- Content Library
- Automation

---

## workflows

Purpose:
Repeatable processes.

Fields:

- id
- owner_identity_id
- name
- description
- status

---

## agents

Purpose:
AI operating entities.

Fields:

- id
- owner_identity_id
- name
- role
- description
- status

Examples:

- Research Agent
- Sales Agent
- Content Agent

---

## blueprints

Purpose:
Structured plans.

Fields:

- id
- owner_identity_id
- name
- blueprint_type
- description

---

## offers

Purpose:
Revenue mechanisms.

Fields:

- id
- owner_identity_id
- asset_id
- name
- offer_type
- price
- status

---

## knowledge_records

Purpose:
Preserved intelligence.

Fields:

- id
- owner_identity_id
- title
- category
- content_reference
- source
- created_at

---

## outcomes

Purpose:
Track results.

Fields:

- id
- owner_identity_id
- outcome_type
- value
- date_recorded

Examples:

- Revenue
- Leads
- Assets Created
- Hours Saved

---

# Relationship Layer

## relationships

Purpose:
Universal connection table.

Fields:

- id
- source_object_type
- source_object_id
- relationship_type
- target_object_type
- target_object_id
- created_at

Examples:

Identity → owns → Asset

Project → creates → Asset

System → contains → Workflow

Agent → executes → Workflow

---

# Ownership Model

Every object must resolve back to:

identity_id

Ownership is foundational.

Authentication may change.

Ownership persists.

---

# Graph Support

The graph is generated from:

Objects
+
Relationships

No separate graph database is required in MVP.

Graph views can be generated from relationships.

---

# JYSON Integration

JYSON can:

- Discover objects
- Suggest objects
- Recommend relationships
- Detect missing infrastructure

JYSON should never directly own objects.

---

# ACCESS Integration

ACCESS manages:

- Identity
- Ownership
- Registry
- Relationships

ACCESS is the source of truth.

---

# Builder Integration

Builder creates:

- Projects
- Systems
- Workflows
- Assets

---

# Vault Integration

Vault preserves:

- Knowledge Records
- Assets
- History

---

# MVP Tables

Required:

- identities
- organizations
- systems
- projects
- assets
- relationships
- knowledge_records

Everything else can be added incrementally.

---

# Final Principle

The schema should model ownership, value, and relationships first.

Features should be built on top of the model.

Never build features that violate the object model, registry architecture, or doctrine.
