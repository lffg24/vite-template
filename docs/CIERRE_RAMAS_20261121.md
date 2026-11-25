# Cierre de ramas · 2026-11-21

Ramas remotas eliminadas porque **todo su contenido ya está en `main`** (fusionadas, o con parches idénticos ya aplicados). No se perdió trabajo.

Para restaurar una: `git push origin <SHA>:refs/heads/<nombre>`.

## Backend (`lffg24/eva-360`)

| Rama | SHA | Motivo |
|---|---|---|
| `codex/backend-warning-cleanup` | `9837f3be8440` | parches ya en main |
| `codex/base-form-reports` | `0d4ffa146a58` | fusionada |
| `codex/base-reports-complete-structure` | `78941a0ac7f7` | fusionada |
| `codex/bulk-individual-reports` | `8f66b7aa50ce` | fusionada |
| `codex/filter-closed-report-apps` | `268b28a32553` | fusionada |
| `codex/fix-ci-audit` | `3b5ae4d4efcb` | fusionada |
| `codex/hotfix-pdf-closure-stress` | `183d19c26f18` | fusionada |
| `codex/password-recovery` | `e0c9e7d28423` | fusionada |
| `codex/preprod-btr-transversal-content` | `6767c22d47d9` | fusionada |
| `codex/preprod-consolidated-domain-charts` | `23f3a0ea789c` | fusionada |
| `codex/preprod-responsive-segmented-reports` | `c98738aa2f94` | fusionada |
| `codex/psl-late-credit-debit` | `9c2c369a3fca` | fusionada |
| `codex/psl-second-review` | `b590a364740d` | fusionada |
| `codex/release-btr-transversal-prod` | `f381a0147228` | fusionada |
| `codex/release-consolidated-domain-charts-prod` | `6e2f26f2c106` | fusionada |
| `codex/report-doc-ui-cleanup` | `76c78bf8c158` | fusionada |
| `codex/scoring-certified-audit` | `5a6fcd693f8c` | fusionada |
| `codex/unified-transversal-reports-v2` | `300543f02b39` | fusionada |
| `railway/code-change-cfdEcD` | `570329f4689b` | fusionada |
| `respaldo/pre-rebase-2d35473/f1-fundacion-hseq` | `288c107ef800` | parches ya en main |
| `respaldo/pre-rebase-2d35473/f1-seguridad-base` | `acd161d8e6ca` | parches ya en main |
| `respaldo/pre-rebase-2d35473/fix-preprod-test-doubles` | `61a544beb190` | parches ya en main |
| `respaldo/pre-rebase-2d35473/hseq-stored-object` | `83790f0ec875` | parches ya en main |

## Frontend (`lffg24/vite-template`)

| Rama | SHA | Motivo |
|---|---|---|
| `codex/areas-cargos-tabs-pagination` | `67ee5ebb3ab0` | parches ya en main |
| `codex/base-form-reports` | `2b38bd14030c` | fusionada |
| `codex/base-reports-complete-structure` | `cf6e722430e1` | fusionada |
| `codex/bulk-individual-reports` | `c1272e0bc575` | fusionada |
| `codex/company-edit-hotfix` | `57af7af4fd29` | fusionada |
| `codex/deploy-frontend-prod` | `825f20578dff` | fusionada |
| `codex/filter-closed-report-apps` | `1d55d4561852` | fusionada |
| `codex/fix-ci-audit` | `5e610d6371c2` | fusionada |
| `codex/hotfix-pdf-closure-stress` | `ee12796c068e` | fusionada |
| `codex/password-recovery` | `0cb936c916c6` | fusionada |
| `codex/preprod-btr-transversal-content` | `b1447d4bd3e4` | fusionada |
| `codex/preprod-responsive-segmented-reports` | `2712e66ec229` | fusionada |
| `codex/release-btr-transversal-prod` | `3931d6b9d6d5` | fusionada |
| `codex/report-doc-ui-cleanup` | `920dcb023b47` | fusionada |
| `codex/safe-employee-company-deletions` | `a568ad186051` | fusionada |
| `codex/session-draft-recovery` | `57615a78f6c1` | fusionada |
| `codex/session-release-test-deps` | `949e172e07b2` | fusionada |
| `codex/sync-preprod-prod-20261017-ui` | `2df79e1c4841` | fusionada |
| `codex/sync-prod-plan-20261104-ui` | `4cf232072664` | fusionada |
| `codex/unified-transversal-reports` | `1eb2d8a154fb` | fusionada |
| `codex/unified-transversal-reports-v2` | `f6abc15e3dd3` | fusionada |
| `respaldo/frontend-main-local-20261114` | `ca752fa4fbc1` | parches ya en main |

Los SHA completos están en el reflog de GitHub unos 90 días; esta tabla usa los 12 primeros caracteres.
