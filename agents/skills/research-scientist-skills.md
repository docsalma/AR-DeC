# Research Scientist Skills

## Skill 1: Literature Synthesis
**Trigger**: "synthesize literature on [topic]" or "write literature review for [section]"
**Process**:
1. Query RAG: `py rag/query.py search "[topic]" --limit 15`
2. Group results by theme/subtopic
3. Identify consensus, contradictions, and gaps
4. Write synthesis paragraphs with proper citations
5. Generate BibTeX entries for cited works
**Output**: LaTeX-formatted literature review section with \cite{} references

## Skill 2: Theoretical Framework Design
**Trigger**: "design theoretical framework" or "integrate ARCS with Bloom's"
**Process**:
1. Review ARCS model components (Attention, Relevance, Confidence, Satisfaction)
2. Map Bloom's taxonomy levels to AR-DeC features
3. Create mapping table: Feature → ARCS component → Bloom's level
4. Write justification narrative with literature support
5. Design TikZ diagram of the framework
**Output**: framework.tex section + TikZ figure

## Skill 3: Methodology Design
**Trigger**: "design research methodology" or "write methodology section"
**Process**:
1. Define research questions (RQ1-RQ3)
2. Select Design-Based Research approach with quasi-experimental evaluation
3. Design study: participants, instruments, procedure, data collection
4. Define metrics: learning gains, engagement, usability (SUS), motivation (ARCS)
5. Plan statistical analysis: paired t-tests, ANOVA, effect sizes
**Output**: methodology.tex with study design, instruments, and analysis plan

## Skill 4: Research Gap Analysis
**Trigger**: "identify research gaps" or "what's missing in the literature"
**Process**:
1. Query RAG across all categories
2. Map existing research coverage (year, topic, method, population)
3. Identify under-explored intersections (e.g., AR+OCR+ITS combined)
4. Formulate gap statements
5. Position AR-DeC as addressing the identified gap
**Output**: Gap analysis summary + introduction positioning text

## Skill 5: Abstract & Conclusion Writing
**Trigger**: "write abstract" or "write conclusion"
**Process**:
1. Summarize: problem, approach, methodology, key findings, contribution
2. Abstract: 200-250 words, structured (Background-Method-Results-Conclusion)
3. Conclusion: revisit RQs, summarize findings, state limitations, future work
4. Ensure alignment between abstract claims and actual results
**Output**: abstract.tex and/or conclusion.tex
