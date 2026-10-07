const fs = require('fs');
const path = require('path');

const jsPath = path.resolve('public/assets/index-BP0a-rN1.js');
let js = fs.readFileSync(jsPath, 'utf8');

// 1. Update To() topbar to add Download button next to "Ver cardapio"
// Old: <a class="btn secondary" href="${so(e)}">Ver cardapio</a>
// New: <a class="btn secondary" href="${so(e)}" target="_blank">Ver cardapio</a>
//      <button class="btn secondary" type="button" data-action-click="download-menu-pdf" title="Baixar cardápio em PDF">Download</button>

const oldBtn = '<a class="btn secondary" href="${so(e)}">Ver cardapio</a>';
const newBtn = '<a class="btn secondary" href="${so(e)}" target="_blank">Ver cardapio</a>\n        <button class="btn secondary" type="button" data-action-click="download-menu-pdf" title="Baixar cardápio em PDF">Download</button>';

if (!js.includes(oldBtn)) {
  console.log('Old button pattern not found directly, checking variations...');
} else {
  // Replace only the first occurrence in To()
  js = js.replace(oldBtn, newBtn);
  console.log('Replaced topbar button in To()');
}

// 2. Add generateMenuPdf function and action click handler in dc()
const actionPattern = 'if(s===`select-company`';
const newActionHandler = `if(s===\`download-menu-pdf\`){generateMenuPdf(uo());return}\n    ` + actionPattern;

if (js.includes(actionPattern) && !js.includes('s===`download-menu-pdf`')) {
  js = js.replace(actionPattern, newActionHandler);
  console.log('Added download-menu-pdf action handler to dc()');
}

// 3. Add generateMenuPdf implementation function
const pdfFunction = `
async function generateMenuPdf(comp){
  if(!comp){alert('Nenhuma empresa selecionada para gerar PDF.');return}
  let now=new Date(),
      day=String(now.getDate()).padStart(2,'0'),
      month=String(now.getMonth()+1).padStart(2,'0'),
      year=now.getFullYear(),
      hours=String(now.getHours()).padStart(2,'0'),
      mins=String(now.getMinutes()).padStart(2,'0'),
      dateStr=\`\${day}/\${month}/\${year} às \${hours}:\${mins}\`,
      cats=(typeof Cc==='function'?Cc(comp.categories||[]):(comp.categories||[])).filter(c=>c.active!==!1),
      allProds=(comp.products||[]).filter(p=>p.active!==!1);

  if(!allProds.length){
    alert('Não há produtos ativos para gerar o cardápio em PDF.');
    return;
  }

  // Create loading overlay
  let loadingEl=document.createElement('div');
  loadingEl.id='vfm-pdf-loading';
  loadingEl.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;gap:12px;';
  loadingEl.innerHTML='<div style=\"width:40px;height:40px;border:4px solid #fff;border-top-color:transparent;border-radius:50%;animation:vfmSpin 0.8s linear infinite;\"></div><div style=\"font-size:16px;font-weight:700;\">Gerando PDF do cardápio...</div><style>@keyframes vfmSpin{to{transform:rotate(360deg)}}</style>';
  document.body.appendChild(loadingEl);

  function removeLoading(){
    let el=document.getElementById('vfm-pdf-loading');
    if(el)el.remove();
  }

  // Group products by active categories
  let grouped=[];
  for(let c of cats){
    let prods=allProds.filter(p=>p.categoryId===c.id);
    if(prods.length>0){
      grouped.push({category:c.name,products:prods});
    }
  }
  let categorizedIds=new Set(cats.map(c=>c.id));
  let uncatProds=allProds.filter(p=>!p.categoryId||!categorizedIds.has(p.categoryId));
  if(uncatProds.length>0){
    grouped.push({category:'Outros',products:uncatProds});
  }

  // Build printable container
  let container=document.createElement('div');
  container.id='vfm-pdf-print-container';
  container.style.cssText='position:absolute;left:-9999px;top:0;width:190mm;background:#fff;color:#111;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;padding:0;box-sizing:border-box;';

  let html=\`
    <div style="padding: 0 0 10px 0; margin-bottom: 12px; border-bottom: 2px solid #1d1b18; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="margin: 0; font-size: 20pt; font-weight: 800; color: #1d1b18; text-transform: uppercase; letter-spacing: 0.5px;">\${comp.name||'Cardápio'}</h1>
        <p style="margin: 3px 0 0 0; font-size: 10pt; color: #4b5563; font-weight: 600;">Cardápio Digital</p>
      </div>
      <div style="text-align: right; font-size: 8.5pt; color: #6b7280;">
        <div>\${comp.address||''}</div>
        <div>\${comp.phone||comp.whatsapp||''}</div>
      </div>
    </div>
  \`;

  for(let group of grouped){
    html+=\`
      <div style="margin-top: 14px; margin-bottom: 6px; page-break-after: avoid; break-after: avoid;">
        <div style="background: #f8fafc; border-left: 4px solid #d94f30; padding: 4px 8px; border-radius: 0 4px 4px 0;">
          <h2 style="margin: 0; font-size: 12pt; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">\${group.category}</h2>
        </div>
      </div>
    \`;

    for(let prod of group.products){
      let namePt=prod.translations?.pt?.name||prod.name||'Produto',
          descPt=prod.translations?.pt?.description||prod.descriptionPt||prod.description||'',
          priceNum=Number(prod.price)||0,
          priceFormatted=priceNum.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),
          imgSrc=prod.image||prod.images?.[0]||'';

      html+=\`
        <div class="pdf-product-row" style="display: flex; gap: 10px; align-items: flex-start; padding: 6px 0; border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; break-inside: avoid;">
          <div style="width: 3cm; height: 3cm; min-width: 3cm; max-width: 3cm; min-height: 3cm; max-height: 3cm; overflow: hidden; border-radius: 4px; border: 1px solid #e2e8f0; flex-shrink: 0; background: #f8fafc; display: flex; align-items: center; justify-content: center;">
            \${imgSrc?\`<img src="\${imgSrc}" style="width: 3cm; height: 3cm; object-fit: cover; display: block;" crossorigin="anonymous" />\`:\`<div style="font-size: 8pt; color: #94a3b8; font-weight: 700; text-align: center; padding: 4px;">Sem foto</div>\`}
          </div>
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; padding-top: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
              <strong style="font-size: 11pt; color: #0f172a; font-weight: 700; line-height: 1.2;">\${namePt}</strong>
              <strong style="font-size: 11pt; color: #d94f30; font-weight: 800; white-space: nowrap; margin-left: auto;">R$ \${priceFormatted}</strong>
            </div>
            \${descPt?\`<p style="margin: 0; font-size: 8.5pt; color: #475569; line-height: 1.35; white-space: pre-line;">\${descPt}</p>\`:\`\`}
          </div>
        </div>
      \`;
    }
  }

  container.innerHTML=html;
  document.body.appendChild(container);

  // Load html2pdf dynamically if not present
  try {
    if(!window.html2pdf){
      await new Promise((resolve,reject)=>{
        let s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        s.onload=resolve;
        s.onerror=reject;
        document.head.appendChild(s);
      });
    }

    let cleanName=(comp.name||'Cardapio').replace(/[^a-zA-Z0-9_-]/g,'_');
    let opt={
      margin: [8, 8, 12, 8],
      filename: \`Cardapio_\${cleanName}.pdf\`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    let worker=window.html2pdf().set(opt).from(container).toPdf().get('pdf').then(function(pdf){
      let totalPages=pdf.internal.getNumberOfPages();
      for(let i=1;i<=totalPages;i++){
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100,100,100);
        let pNum=String(i).padStart(2,'0');
        let tNum=String(totalPages).padStart(2,'0');
        let footerText=\`\${pNum} de \${tNum} • Gerado em \${dateStr}\`;
        pdf.text(footerText, 105, 297 - 5, { align: 'center' });
      }
    }).save();

    await worker;
    removeLoading();
    container.remove();
  } catch(err) {
    console.warn('html2pdf fallback to print window:', err);
    removeLoading();
    // Fallback: Open print dialog
    let printWin=window.open('','_blank');
    if(printWin){
      printWin.document.write(\`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Cardápio - \${comp.name||''}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm 8mm 12mm 8mm; }
            body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; color: #111; margin: 0; padding: 0; }
            .pdf-product-row { page-break-inside: avoid; break-inside: avoid; }
            @media print {
              .no-print { display: none !important; }
              #footer-running { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #666; }
            }
          </style>
        </head>
        <body>
          \${container.innerHTML}
          <div id="footer-running" class="no-print" style="margin-top: 20px; text-align: center; font-size: 8pt; color: #888;">
            Gerado em \${dateStr}
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      \`);
      printWin.document.close();
    }
    container.remove();
  }
}
`;

// Append generateMenuPdf before window.VFM_SUPABASE_API assignment or at bottom of public bundle
if (!js.includes('function generateMenuPdf(')) {
  js = js + '\n' + pdfFunction;
  console.log('Added generateMenuPdf function to index-BP0a-rN1.js');
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('Successfully updated public/assets/index-BP0a-rN1.js with PDF download button and generator');
