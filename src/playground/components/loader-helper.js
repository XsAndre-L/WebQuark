export async function loadComponentResources(name) {
  // 1. Fetch HTML template
  const htmlRes = await fetch(`/components/${name}/${name}.html`);
  if (!htmlRes.ok) throw new Error(`Failed to load template for ${name}: ${htmlRes.status}`);
  const html = await htmlRes.text();

  // 2. Mount CSS stylesheet dynamically if not already in document head
  const cssUrl = `/components/${name}/${name}.css`;
  if (!document.querySelector(`link[href="${cssUrl}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    document.head.appendChild(link);
  }

  return html;
}
