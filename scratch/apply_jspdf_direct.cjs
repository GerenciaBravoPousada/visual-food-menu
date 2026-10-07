const fs = require('fs');
const path = require('path');

const jsPath = path.resolve('public/assets/index-BP0a-rN1.js');
let js = fs.readFileSync(jsPath, 'utf8');

const startMarker = 'async function generateMenuPdf(';
const startIdx = js.indexOf(startMarker);
if (startIdx === -1) {
  throw new Error('generateMenuPdf not found in index-BP0a-rN1.js');
}

const newFunction = `async function generateMenuPdf(comp){
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
  loadingEl.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Inter,system-ui,sans-serif;gap:14px;';
  loadingEl.innerHTML='<div style=\"width:44px;height:44px;border:4px solid rgba(255,255,255,0.3);border-top-color:#d94f30;border-radius:50%;animation:vfmSpin 0.7s linear infinite;\"></div><div style=\"font-size:16px;font-weight:700;\">Gerando PDF do cardápio...</div><div style=\"font-size:12px;color:#94a3b8;\">Aguarde o download automático</div><style>@keyframes vfmSpin{to{transform:rotate(360deg)}}</style>';
  document.body.appendChild(loadingEl);

  function removeLoading(){
    let el=document.getElementById('vfm-pdf-loading');
    if(el)el.remove();
  }

  // Helper to fetch and convert image to base64 Data URL
  async function fetchImageDataUrl(url){
    if(!url)return null;
    if(url.startsWith('data:'))return url;
    try {
      let res=await fetch(url,{mode:'cors'});
      if(res.ok){
        let blob=await res.blob();
        return await new Promise((resolve)=>{
          let reader=new FileReader();
          reader.onloadend=()=>resolve(reader.result);
          reader.onerror=()=>resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch(e){}
    try {
      return await new Promise((resolve)=>{
        let img=new Image();
        img.crossOrigin='anonymous';
        img.onload=()=>{
          try {
            let canvas=document.createElement('canvas');
            canvas.width=img.naturalWidth||120;
            canvas.height=img.naturalHeight||120;
            let ctx=canvas.getContext('2d');
            ctx.drawImage(img,0,0);
            resolve(canvas.toDataURL('image/jpeg',0.85));
          } catch(err){
            resolve(null);
          }
        };
        img.onerror=()=>resolve(null);
        img.src=url;
      });
    } catch(err){
      return null;
    }
  }

  try {
    // Load jsPDF library from CDN if not already loaded
    if(!window.jspdf){
      await new Promise((resolve,reject)=>{
        let s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload=resolve;
        s.onerror=reject;
        document.head.appendChild(s);
      });
    }

    // Group active products by active categories
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

    // Pre-fetch images in parallel with concurrency limit
    for(let group of grouped){
      for(let prod of group.products){
        let imgSrc=prod.image||prod.images?.[0]||'';
        prod._imageDataUrl=await fetchImageDataUrl(imgSrc);
      }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const maxContentY = pageHeight - 14;
    let currentY = margin;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(29, 27, 24);
    doc.text((comp.name || 'Cardápio').toUpperCase(), margin, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('CARDÁPIO DIGITAL', margin, currentY + 11);

    if (comp.phone || comp.whatsapp || comp.address) {
      let contactParts = [comp.address, comp.phone || comp.whatsapp].filter(Boolean);
      doc.setFontSize(8);
      doc.text(contactParts.join(' • '), pageWidth - margin, currentY + 6, { align: 'right' });
    }

    doc.setDrawColor(217, 79, 48);
    doc.setLineWidth(0.6);
    doc.line(margin, currentY + 14, pageWidth - margin, currentY + 14);

    currentY += 18;

    for (let group of grouped) {
      if (currentY + 12 > maxContentY) {
        doc.addPage();
        currentY = margin;
      }

      // Category Header Box
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 7, 'F');
      
      doc.setFillColor(217, 79, 48);
      doc.rect(margin, currentY, 2, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(group.category.toUpperCase(), margin + 5, currentY + 5);

      currentY += 9;

      for (let prod of group.products) {
        let namePt = prod.translations?.pt?.name || prod.name || 'Produto',
            descPt = prod.translations?.pt?.description || prod.descriptionPt || prod.description || '',
            priceNum = Number(prod.price) || 0,
            priceFormatted = 'R$ ' + priceNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const imgSize = 30; // 3cm x 3cm exactly
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        let descLines = descPt ? doc.splitTextToSize(descPt, 145) : [];
        let textHeight = 8 + (descLines.length * 3.5);
        let rowHeight = Math.max(imgSize, textHeight) + 2;

        if (currentY + rowHeight > maxContentY) {
          doc.addPage();
          currentY = margin;
        }

        // Draw 3x3cm image
        let imgData = prod._imageDataUrl;
        if (imgData) {
          try {
            let format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(imgData, format, margin, currentY, imgSize, imgSize);
          } catch (e) {
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY, imgSize, imgSize, 'FD');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text('Sem foto', margin + (imgSize / 2), currentY + (imgSize / 2), { align: 'center' });
          }
        } else {
          doc.setDrawColor(226, 232, 240);
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, currentY, imgSize, imgSize, 'FD');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text('Sem foto', margin + (imgSize / 2), currentY + (imgSize / 2), { align: 'center' });
        }

        const textX = margin + imgSize + 3;

        // Product Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(namePt, textX, currentY + 5);

        // Product Price
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(217, 79, 48);
        doc.text(priceFormatted, pageWidth - margin, currentY + 5, { align: 'right' });

        // Product Description
        if (descLines.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text(descLines, textX, currentY + 9.5);
        }

        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

        currentY += rowHeight + 1.5;
      }
    }

    // Footers on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      let pNum = String(i).padStart(2, '0');
      let tNum = String(totalPages).padStart(2, '0');
      let footerText = \`\${pNum} de \${tNum} • Gerado em \${dateStr}\`;
      doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    let cleanName = (comp.name || 'Cardapio').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(\`Cardapio_\${cleanName}.pdf\`);

    removeLoading();
  } catch (err) {
    console.error('jsPDF generation error:', err);
    removeLoading();
    alert('Erro ao gerar PDF: ' + (err.message || err));
  }
}`;

js = js.slice(0, startIdx) + newFunction;
fs.writeFileSync(jsPath, js, 'utf8');
console.log('Successfully updated generateMenuPdf with direct jsPDF rendering in public/assets/index-BP0a-rN1.js');
