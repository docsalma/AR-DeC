# LaTeX Specialist Skills

## Skill 1: Template Setup
**Trigger**: "set up LaTeX template" or "initialize article"
**Process**:
1. Download Springer Nature sn-jnl.cls template (or IEEE template)
2. Create main.tex with document class, packages, and \input{} structure
3. Configure: bibliography style, hyperref, cleveref, graphicx, tikz, booktabs
4. Set up sections/ directory with empty .tex files for each section
5. Create references.bib with initial entries
6. Test compile to verify clean build
**Output**: Complete LaTeX project that compiles to PDF

## Skill 2: Architecture Diagram Creation
**Trigger**: "create system architecture figure" or "draw architecture diagram"
**Process**:
1. Design system architecture as TikZ diagram
2. Include all layers: Mobile App → OCR → ITS → AR → Gamification
3. Show data flow arrows between components
4. Color-code by module type (input, processing, output, storage)
5. Add labels and brief descriptions
6. Export as standalone figure
**Output**: TikZ architecture diagram (figures/architecture.tex)

## Skill 3: Literature Comparison Table
**Trigger**: "create comparison table" or "literature summary table"
**Process**:
1. Define comparison dimensions: Year, AR type, ITS type, Gamification, OCR, Mobile, Evaluation
2. Select 15-20 most relevant articles from the 47
3. Fill comparison matrix with checkmarks/details
4. Highlight AR-DeC's unique combination (last row)
5. Format with booktabs (toprule, midrule, bottomrule)
6. Ensure table fits page width (use small font or landscape if needed)
**Output**: LaTeX table in tables/comparison.tex

## Skill 4: Results Visualization
**Trigger**: "create results charts" or "visualize data"
**Process**:
1. Create pgfplots charts for quantitative results
2. Bar charts: pre-test vs. post-test scores
3. Box plots: score distributions by group
4. Line charts: learning progress over time
5. Radar charts: ARCS motivation scores
6. Tables: descriptive statistics, t-test results, effect sizes
**Output**: pgfplots figures + results tables

## Skill 5: Pre-Submission Checklist
**Trigger**: "prepare for submission" or "final check"
**Process**:
1. Verify word count (target: 8000-10000)
2. Check all figures: vector format, readable at print size, captioned
3. Check all tables: properly formatted, referenced in text
4. Verify all citations: every \cite matches a \bibitem
5. Check formatting: margins, fonts, section numbering
6. Verify: abstract word count, keyword count, author affiliations
7. Generate supplementary materials if needed
8. Write cover letter to editor
**Output**: Submission-ready manuscript + cover letter
