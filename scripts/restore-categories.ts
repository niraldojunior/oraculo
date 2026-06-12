import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Best-effort restoration based on system names and team assignments.
// Review and correct via UI any assignments that don't look right.
const categoryMap: Record<string, string> = {
  // ── Fulfillment & Assurance ──────────────────────────────────────
  's_apitt':                                    'Ticket Problema',
  's_pega':                                     'Ticket Problema',
  's_apicom':                                   'Apoio',
  's_gcpos':                                    'Apoio',
  's_pega_eventos':                             'Apoio',
  's_portal_op':                                'Apoio',
  's_portal_dev':                               'Apoio',
  's_soa_ftth':                                 'Apoio',
  's_order_inv':                                'Inventário Serviços',
  's_service_inv':                              'Inventário Serviços',
  's_netcool':                                  'Supervisão Recurso',
  's_pega_tecto':                               'Ordem Serviço',
  '291aedf6-fcc0-47af-a0dc-3ed5c14ba1e3':       'Ordem Serviço',  // API Service Order
  '1c620f35-6bc6-4846-9464-b737cc8c552b':       'Ordem Serviço',  // Order Entry
  's_som':                                      'Ordem Serviço',
  '66f300de-8ebe-44b9-970e-9fbdd38e4f7b':       'Ordem Serviço',  // API Product Order
  'a40cc9cf-33c4-47b2-9c62-4cbc249ba4c8':       'Ordem Serviço',  // OMR

  // ── Network Management ───────────────────────────────────────────
  's_api_viab':                                 'Viabilidade Serviço',
  's_portal_qual':                              'Viabilidade Serviço',
  's_fuzzy':                                    'Cadastro Endereço',
  's_geosite':                                  'Cadastro Endereço',
  's_geosite_brics':                            'Cadastro Endereço',
  's_res_inv':                                  'Catalogo/Inventário Recursos',
  's_gcp_inv':                                  'Catalogo/Inventário Recursos',
  's_portal_diag':                              'Teste Serviço/Recurso',
  's_api_test':                                 'Teste Serviço/Recurso',
  's_vrifca':                                   'Teste Serviço/Recurso',
  's_vigia':                                    'Teste Serviço/Recurso',
  's_crf':                                      'Teste Serviço/Recurso',
  '24454e33-9261-46d6-871b-b396a82405d0':       'Ordem Recurso',  // API Resource Activation
  's_sis':                                      'Uso Serviço / Legal',
  's_qsi':                                      'Uso Serviço / Legal',
  's_network_core':                             'Config. Recurso',
  '479f2720-ee51-438e-8c14-9e300c4f47ac':       'Config. Recurso',  // Maestro
  's_captive_portal':                           'Config. Recurso',
  's_netq':                                     'Config. Recurso',
  's_netwin':                                   'Planejamento/Construção de Rede',
  's_portal_eng':                               'Planejamento/Construção de Rede',

  // ── Workforce Management ─────────────────────────────────────────
  's_api_wo':                                   'Ordem Campo / Força de Trabalho',
  's_ofs':                                      'Ordem Campo / Força de Trabalho',
  's_api_app':                                  'Ordem Campo / Força de Trabalho',
  's_fsl':                                      'Ordem Campo / Força de Trabalho',
  's_antecipa_sa':                              'Suprimentos',
  's_gestech':                                  'Suprimentos',
  's_op_mobile':                                'Apoio',
  's_co_digital':                               'Apoio',
  's_mulesoft':                                 'Apoio',
  's_oic':                                      'Apoio',
  's_smart_desk':                               'Apoio',
  's_autosservico':                             'Apoio',
  's_colmeia':                                  'Apoio',
  's_ccaip':                                    'Apoio',
  's_client_desk':                              'Apoio',

  // ── Sem Time (melhor estimativa) ─────────────────────────────────
  's_portal_do':                                'Ordem Serviço',
  's_na_f':                                     'Config. Recurso',
  's_aws_atacado':                              'Apoio',
  's_apc_nokia':                                'Config. Recurso',
  's_ncegpon':                                  'Config. Recurso',
  's_ume_zte':                                  'Config. Recurso',
  's_nas':                                      'Config. Recurso',
  's_nceip':                                    'Config. Recurso',
  's_ims_nokia':                                'Config. Recurso',
  's_hdm_nokia':                                'Config. Recurso',
  's_vitalqip':                                 'Cadastro Endereço',
};

async function main() {
  let updated = 0;
  let skipped = 0;

  for (const [id, category] of Object.entries(categoryMap)) {
    try {
      await prisma.system.update({ where: { id }, data: { category } });
      console.log(`✓ ${id} → "${category}"`);
      updated++;
    } catch (e: any) {
      console.warn(`⚠ skipped ${id}: ${e?.message}`);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
