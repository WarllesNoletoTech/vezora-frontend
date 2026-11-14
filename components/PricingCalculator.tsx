'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CheckCircle2,Minus,Plus,Users} from 'lucide-react';
import {brl} from '@/lib/api';

export type PublicPricing={
 monthlyPriceCents:number;
 firstMonthPriceCents:number|null;
 additionalProfessionalCents:number;
 trialDays:number;
 includedProfessionals:number;
};
export default function PricingCalculator({pricing}:{pricing:PublicPricing|null}){
 const [professionals,SET]=useState(1);
 const priced=pricing!==null && pricing.monthlyPriceCents>=100;
 const extra=pricing?.additionalProfessionalCents??0;
 const first=(pricing?.firstMonthPriceCents??pricing?.monthlyPriceCents??0)+(professionals-1)*extra;
 const renewal=(pricing?.monthlyPriceCents??0)+(professionals-1)*extra;
 return <section className="section container" id="planos" aria-labelledby="vezora-pricing-title">
  <div className="section-heading"><span className="overline">PLANOS E PREÇOS</span>
   <h2 id="vezora-pricing-title">Um preço que acompanha <em>o tamanho do seu negócio.</em></h2>
   <p>Você começa com uma profissional e amplia a equipe quando precisar. Sem surpresas no cálculo da assinatura.</p>
  </div>
  <div className="vezora-pricing-grid">
   <article className="vezora-pricing-plan">
    <div className="vezora-pricing-eyebrow"><Users size={17}/> CONFIGURE SUA EQUIPE</div>
    <h3>Quantos profissionais usam a agenda?</h3>
    <p>O primeiro já está incluso. Ajuste para visualizar os valores do seu espaço.</p>
    <div className="vezora-count-picker" role="group" aria-label="Número de profissionais">
     <button type="button" aria-label="Remover profissional" disabled={professionals===1} onClick={()=>SET(v=>Math.max(1,v-1))}><Minus size={19}/></button>
     <strong aria-live="polite">{professionals}</strong>
     <button type="button" aria-label="Adicionar profissional" disabled={professionals===20} onClick={()=>SET(v=>Math.min(20,v+1))}><Plus size={19}/></button>
    </div>
    <small>Até 20 profissionais na simulação. Adicionar após o início de um ciclo ativo gera cobrança proporcional até o vencimento.</small>
    <ul className="vezora-pricing-benefits">
     <li><CheckCircle2 size={17}/> Página própria com sua identidade visual</li>
     <li><CheckCircle2 size={17}/> Agenda e horários individuais</li>
     <li><CheckCircle2 size={17}/> Confirmações pelo WhatsApp manual</li>
     <li><CheckCircle2 size={17}/> Opção de sinal por Pix e cartão</li>
    </ul>
   </article>
   <article className="vezora-pricing-summary">
    <span className="vezora-pricing-eyebrow">SUA ASSINATURA VEZORA</span>
    {priced ? <>
     <div className="vezora-price-main"><span>Primeiro mês</span><strong>{brl(first)}</strong></div>
     <div className="vezora-price-renewal"><span>A partir do segundo mês</span><strong>{brl(renewal)} <small>/mês</small></strong></div>
     <div className="vezora-pricing-lines">
      <div><span>Mensalidade base</span><b>{brl(pricing.monthlyPriceCents)}</b></div>
      <div><span>Primeiro mês base</span><b>{brl(pricing.firstMonthPriceCents??pricing.monthlyPriceCents)}</b></div>
      <div><span>Profissionais adicionais ({professionals-1})</span><b>{brl((professionals-1)*extra)}/mês</b></div>
     </div>
     <p>Os valores são calculados a partir do preço definido no Vezora. O 1º mês promocional, quando houver, é pago via Pix. O cartão recorrente utiliza o valor normal.</p>
    </> : <><h3>Em configuração</h3><p>Os preços serão exibidos aqui assim que forem publicados pelo administrador.</p></>}
    {pricing&&pricing.trialDays>0&&<p className="vezora-pricing-trial">Experimente por {pricing.trialDays} {pricing.trialDays===1?'dia':'dias'} antes de contratar.</p>}
    <Link href="/cadastro" className="btn btn-primary">Criar meu espaço <ArrowRight size={18}/></Link>
   </article>
  </div>
 </section>;
}
