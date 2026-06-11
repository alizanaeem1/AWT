const normalLabTemplate = {
  objective:
    'Practice a focused AWT skill by building a small, testable web feature and checking the result in the browser.',
  tools: ['VS Code', 'Chrome or Edge', 'Node.js', 'Vite dev server'],
  steps: [
    'Read the objective and create the required files.',
    'Write the starter markup and keep the structure semantic.',
    'Add styling or logic in small, testable changes.',
    'Run the app and compare your output with the preview.',
    'Fix common errors, then complete the checklist.'
  ],
  code: `<main class="lab-card">
  <h1>AWT Lab</h1>
  <p>Build the feature, test it, and submit your work.</p>
  <button>Run check</button>
</main>`,
  output: 'A clean lab card with a title, short instruction, and action button.',
  errors: [
    'The dev server is not running before opening the page.',
    'File names or import paths do not match exactly.',
    'CSS classes are added but the stylesheet is not imported.'
  ],
  tips: [
    'Complete one step at a time and refresh the browser after each change.',
    'Use browser DevTools to inspect layout and console errors.',
    'Keep your final submission simple, readable, and working.'
  ],
  checklist: ['Code runs without errors', 'Output matches the preview', 'All lab steps are checked']
}

const labTitles = [
  'HTML Document Structure',
  'CSS Layouts',
  'DOM Basics',
  'Form Validation',
  'React Components',
  'State and Props',
  'Routing Practice',
  'Mid Term',
  'Node Server Basics',
  'REST API',
  'Supabase Tables',
  'Authentication Flow',
  'Mini Project UI',
  'Deployment Prep',
  'Final Term'
]

export const labs = labTitles.map((title, index) => {
  const number = index + 1
  const id = `lab-${number}`
  const isExam = number === 8 || number === 15

  return {
    ...normalLabTemplate,
    id,
    slug: id,
    number,
    title: isExam ? title : `Lab ${number}: ${title}`,
    objective:
      number === 1
        ? 'Create a valid HTML page structure using semantic tags, headings, paragraphs, and a clear document outline.'
        : normalLabTemplate.objective,
    code:
      number === 1
        ? `<!doctype html>
<html lang="en">
  <head>
    <title>AWT Lab 1</title>
  </head>
  <body>
    <main>
      <h1>My First Structured Page</h1>
      <p>This page uses semantic HTML.</p>
    </main>
  </body>
</html>`
        : normalLabTemplate.code,
    output:
      number === 1
        ? 'A browser page with a clear heading and paragraph inside the main landmark.'
        : normalLabTemplate.output,
    exam: isExam
      ? {
          label: number === 8 ? 'Mid Term' : 'Final Term',
          message:
            number === 8
              ? 'This slot is reserved for the Mid Term evaluation. Review Labs 1-7 and follow your instructor instructions.'
              : 'This slot is reserved for the Final Term evaluation. Review all labs and prepare your final submission.'
        }
      : null
  }
})

export const labHeadings = [
  { id: 'lab-overview', title: 'Overview' },
  { id: 'objective', title: 'Objective' },
  { id: 'tools', title: 'Required Tools' },
  { id: 'instructions', title: 'Instructions' },
  { id: 'code-examples', title: 'Code Examples' },
  { id: 'output-preview', title: 'Output Preview' },
  { id: 'common-errors', title: 'Common Errors' },
  { id: 'helpful-tips', title: 'Helpful Tips' },
  { id: 'completion', title: 'Completion' }
]

export const examLabHeadings = [
  { id: 'lab-overview', title: 'Overview' },
  { id: 'objective', title: 'Exam Message' }
]

export function findLab(slug) {
  return labs.find((lab) => lab.slug === slug)
}

export function getAdjacentLabs(number) {
  return {
    previous: labs.find((lab) => lab.number === number - 1),
    next: labs.find((lab) => lab.number === number + 1)
  }
}
