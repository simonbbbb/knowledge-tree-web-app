export const DEMO_USER = { id:"u-demo-001",username:"demo",email:"demo@knowledgetree.example",display_name:"Demo Admin",role:"admin" };
export const DEMO_LOGIN = { token:"demo-jwt-token",expires_in:28800,user:DEMO_USER };
const now = Date.now();
const h = (n:number)=>new Date(now - n*36e5).toISOString();
const d = (n:number)=>new Date(now - n*864e5).toISOString();

export const SERVICES = [
  {id:"svc-web",name:"web-gateway",team:"platform",environment:"prod",health:"healthy",description:"Public HTTPS ingress and request router.",language:"Go",repository:"github.com/knowledgetree/web-gateway",owner:"platform@knowledgetree.example",tags:["public","tier-0","pci"],up:0,down:4,lastDiscovered:h(1),coverage:96},
  {id:"svc-checkout",name:"checkout-api",team:"checkout",environment:"prod",health:"healthy",description:"Cart checkout orchestration.",language:"TypeScript",repository:"github.com/knowledgetree/checkout-api",owner:"checkout@knowledgetree.example",tags:["tier-0","pci"],up:1,down:5,lastDiscovered:h(1),coverage:92},
  {id:"svc-payments",name:"payments-service",team:"checkout",environment:"prod",health:"degraded",description:"Payment processing via Stripe.",language:"Go",repository:"github.com/knowledgetree/payments-service",owner:"checkout@knowledgetree.example",tags:["tier-0","pci","external"],up:2,down:3,lastDiscovered:h(1),coverage:88},
  {id:"svc-inventory",name:"inventory-service",team:"catalog",environment:"prod",health:"healthy",description:"Stock levels and fulfilment events.",language:"Go",repository:"github.com/knowledgetree/inventory-service",owner:"catalog@knowledgetree.example",tags:["tier-1"],up:3,down:2,lastDiscovered:h(2),coverage:91},
  {id:"svc-catalog",name:"catalog-api",team:"catalog",environment:"prod",health:"healthy",description:"Product catalogue and faceting.",language:"Python",repository:"github.com/knowledgetree/catalog-api",owner:"catalog@knowledgetree.example",tags:["tier-1","public"],up:1,down:2,lastDiscovered:h(2),coverage:94},
  {id:"svc-identity",name:"identity-service",team:"platform",environment:"prod",health:"healthy",description:"OAuth 2 / OIDC identity provider.",language:"Go",repository:"github.com/knowledgetree/identity-service",owner:"platform@knowledgetree.example",tags:["tier-0","security"],up:1,down:1,lastDiscovered:h(3),coverage:98},
  {id:"svc-orders",name:"orders-service",team:"checkout",environment:"prod",health:"healthy",description:"Order state machine.",language:"TypeScript",repository:"github.com/knowledgetree/orders-service",owner:"checkout@knowledgetree.example",tags:["tier-0"],up:2,down:1,lastDiscovered:h(3),coverage:89},
  {id:"svc-notifications",name:"notifications-service",team:"growth",environment:"prod",health:"healthy",description:"Transactional email, SMS, push.",language:"Node.js",repository:"github.com/knowledgetree/notifications-service",owner:"growth@knowledgetree.example",tags:["tier-2"],up:3,down:1,lastDiscovered:h(4),coverage:82},
  {id:"svc-search",name:"search-api",team:"catalog",environment:"prod",health:"healthy",description:"OpenSearch facade with re-ranking.",language:"Python",repository:"github.com/knowledgetree/search-api",owner:"catalog@knowledgetree.example",tags:["tier-2"],up:1,down:1,lastDiscovered:h(5),coverage:93},
  {id:"svc-analytics",name:"analytics-ingest",team:"data",environment:"prod",health:"unhealthy",description:"Clickstream ingest to Kafka.",language:"Go",repository:"github.com/knowledgetree/analytics-ingest",owner:"data@knowledgetree.example",tags:["tier-3"],up:4,down:1,lastDiscovered:h(6),coverage:70},
  {id:"svc-fraud",name:"fraud-detector",team:"risk",environment:"prod",health:"healthy",description:"Real-time fraud scoring.",language:"Python",repository:"github.com/knowledgetree/fraud-detector",owner:"risk@knowledgetree.example",tags:["tier-0","ml"],up:1,down:1,lastDiscovered:h(6),coverage:85},
  {id:"svc-warehouse",name:"warehouse-sync",team:"ops",environment:"prod",health:"healthy",description:"Nightly sync to Snowflake.",language:"Python",repository:"github.com/knowledgetree/warehouse-sync",owner:"data@knowledgetree.example",tags:["batch"],up:5,down:0,lastDiscovered:h(9),coverage:78},
  {id:"svc-recs",name:"recommendations",team:"catalog",environment:"prod",health:"healthy",description:"Personalized recommendations at 30ms P99.",language:"Python",repository:"github.com/knowledgetree/recommendations",owner:"catalog@knowledgetree.example",tags:["tier-2","ml"],up:2,down:1,lastDiscovered:h(10),coverage:80},
  {id:"svc-shipping",name:"shipping-service",team:"checkout",environment:"prod",health:"healthy",description:"Rate shopping and carrier tracking.",language:"Go",repository:"github.com/knowledgetree/shipping-service",owner:"checkout@knowledgetree.example",tags:["tier-1","external"],up:1,down:0,lastDiscovered:h(12),coverage:87},
  {id:"svc-auth-proxy",name:"auth-proxy",team:"platform",environment:"prod",health:"healthy",description:"JWT validation sidecar.",language:"Rust",repository:"github.com/knowledgetree/auth-proxy",owner:"platform@knowledgetree.example",tags:["tier-0","security","internal"],up:0,down:0,lastDiscovered:h(12),coverage:99},
];

export function getSvc(n:string){return SERVICES.find(s=>s.name===n);}
export function getDeps(n:string){const up:string[]=[],down:string[]=[];for(const e of EDGES){if(e.source===`svc-${n}`)down.push(e.target.replace("svc-",""));if(e.target===`svc-${n}`)up.push(e.source.replace("svc-",""));}return{upstream:up.map(x=>getSvc(x)).filter(Boolean) as any[],downstream:down.map(x=>getSvc(x)).filter(Boolean) as any[]};}

export const NODES = [
  ...SERVICES.map(s=>({id:s.id,label:s.name,type:"service",team:s.team,environment:s.environment,health:s.health,namespace:`knowledgetree-${s.team}`,metadata:{language:s.language,tags:s.tags}})),
  {id:"db-orders",label:"orders-postgres",type:"database",team:"checkout",environment:"prod",health:"healthy",namespace:"knowledgetree-checkout",metadata:{engine:"postgres-15"}},
  {id:"db-catalog",label:"catalog-postgres",type:"database",team:"catalog",environment:"prod",health:"healthy",namespace:"knowledgetree-catalog",metadata:{engine:"postgres-15"}},
  {id:"db-identity",label:"identity-postgres",type:"database",team:"platform",environment:"prod",health:"healthy",namespace:"knowledgetree-platform",metadata:{engine:"postgres-15"}},
  {id:"os-catalog",label:"catalog-opensearch",type:"database",team:"catalog",environment:"prod",health:"healthy",namespace:"knowledgetree-catalog",metadata:{engine:"opensearch-2.13"}},
  {id:"redis-session",label:"session-redis",type:"cache",team:"platform",environment:"prod",health:"healthy",namespace:"knowledgetree-platform",metadata:{engine:"redis-7"}},
  {id:"redis-cart",label:"cart-redis",type:"cache",team:"checkout",environment:"prod",health:"healthy",namespace:"knowledgetree-checkout",metadata:{engine:"redis-7"}},
  {id:"kafka-events",label:"kafka-events",type:"queue",team:"data",environment:"prod",health:"degraded",namespace:"knowledgetree-data",metadata:{engine:"MSK",topics:42}},
  {id:"s3-assets",label:"s3-product-assets",type:"storage",team:"catalog",environment:"prod",health:"healthy",namespace:"knowledgetree-catalog",metadata:{bucket:"knowledgetree-prod-assets"}},
  {id:"s3-events",label:"s3-analytics-events",type:"storage",team:"data",environment:"prod",health:"healthy",namespace:"knowledgetree-data",metadata:{bucket:"knowledgetree-prod-events"}},
  {id:"ext-stripe",label:"stripe",type:"external",team:"checkout",environment:"prod",health:"healthy",namespace:"external",metadata:{provider:"Stripe"}},
  {id:"ext-shippo",label:"shippo",type:"external",team:"checkout",environment:"prod",health:"healthy",namespace:"external",metadata:{provider:"Shippo"}},
  {id:"ext-sendgrid",label:"sendgrid",type:"external",team:"growth",environment:"prod",health:"healthy",namespace:"external",metadata:{provider:"SendGrid"}},
  {id:"ext-twilio",label:"twilio",type:"external",team:"growth",environment:"prod",health:"healthy",namespace:"external",metadata:{provider:"Twilio"}},
];

export const EDGES = [
  {id:"e1",source:"svc-web",target:"svc-identity",label:"auth",type:"calls"},
  {id:"e2",source:"svc-web",target:"svc-catalog",label:"browse",type:"calls"},
  {id:"e3",source:"svc-web",target:"svc-checkout",label:"checkout",type:"calls"},
  {id:"e4",source:"svc-web",target:"svc-search",label:"search",type:"calls"},
  {id:"e5",source:"svc-checkout",target:"svc-inventory",label:"reserve",type:"calls"},
  {id:"e6",source:"svc-checkout",target:"svc-payments",label:"charge",type:"calls"},
  {id:"e7",source:"svc-checkout",target:"svc-fraud",label:"score",type:"calls"},
  {id:"e8",source:"svc-checkout",target:"svc-orders",label:"order",type:"calls"},
  {id:"e9",source:"svc-checkout",target:"redis-cart",type:"reads_from"},
  {id:"e10",source:"svc-payments",target:"ext-stripe",label:"charge",type:"calls"},
  {id:"e11",source:"svc-payments",target:"svc-orders",label:"confirm",type:"calls"},
  {id:"e12",source:"svc-payments",target:"kafka-events",label:"payment.captured",type:"publishes"},
  {id:"e13",source:"svc-inventory",target:"db-catalog",type:"writes_to"},
  {id:"e14",source:"svc-inventory",target:"kafka-events",label:"inventory.updated",type:"publishes"},
  {id:"e15",source:"svc-catalog",target:"db-catalog",type:"reads_from"},
  {id:"e16",source:"svc-catalog",target:"os-catalog",type:"reads_from"},
  {id:"e17",source:"svc-catalog",target:"s3-assets",type:"reads_from"},
  {id:"e18",source:"svc-identity",target:"db-identity",type:"writes_to"},
  {id:"e19",source:"svc-identity",target:"redis-session",type:"writes_to"},
  {id:"e20",source:"svc-orders",target:"db-orders",type:"writes_to"},
  {id:"e21",source:"svc-orders",target:"kafka-events",label:"order.created",type:"publishes"},
  {id:"e22",source:"svc-orders",target:"svc-shipping",label:"ship",type:"calls"},
  {id:"e23",source:"svc-notifications",target:"kafka-events",label:"order.created",type:"subscribes"},
  {id:"e24",source:"svc-notifications",target:"ext-sendgrid",type:"calls"},
  {id:"e25",source:"svc-notifications",target:"ext-twilio",type:"calls"},
  {id:"e26",source:"svc-search",target:"os-catalog",type:"reads_from"},
  {id:"e27",source:"svc-analytics",target:"kafka-events",label:"analytics.*",type:"subscribes"},
  {id:"e28",source:"svc-analytics",target:"s3-events",type:"writes_to"},
  {id:"e29",source:"svc-fraud",target:"db-orders",type:"reads_from"},
  {id:"e30",source:"svc-warehouse",target:"db-orders",type:"reads_from"},
  {id:"e31",source:"svc-warehouse",target:"db-catalog",type:"reads_from"},
  {id:"e32",source:"svc-warehouse",target:"db-identity",type:"reads_from"},
  {id:"e33",source:"svc-warehouse",target:"s3-events",type:"reads_from"},
  {id:"e34",source:"svc-warehouse",target:"kafka-events",label:"ingest",type:"subscribes"},
  {id:"e35",source:"svc-recs",target:"db-catalog",type:"reads_from"},
  {id:"e36",source:"svc-recs",target:"s3-events",type:"reads_from"},
  {id:"e37",source:"svc-shipping",target:"ext-shippo",type:"calls"},
  {id:"e38",source:"svc-checkout",target:"svc-identity",label:"verify",type:"calls"},
];

export const CHANGES = [
  {id:"c1",type:"deployed",resourceType:"Deployment",resourceName:"payments-service",scope:"k8s-prod",description:"Deployed payments-service v4.12.0",impact:"medium",timestamp:h(0.5),author:"alex@knowledgetree.example"},
  {id:"c2",type:"modified",resourceType:"Deployment",resourceName:"checkout-api",scope:"k8s-prod",description:"HPA max replicas 30→60",impact:"low",timestamp:h(2),author:"sam@knowledgetree.example"},
  {id:"c3",type:"created",resourceType:"RDS Instance",resourceName:"orders-postgres-replica-2",scope:"aws-prod-us-east-1",description:"New read replica",impact:"medium",timestamp:h(4),author:"terraform"},
  {id:"c4",type:"modified",resourceType:"Service",resourceName:"search-api",scope:"k8s-prod",description:"Service type→LoadBalancer",impact:"high",timestamp:h(6),author:"riley@knowledgetree.example"},
  {id:"c5",type:"deleted",resourceType:"Deployment",resourceName:"legacy-cart-service",scope:"k8s-prod",description:"Decommissioned",impact:"low",timestamp:h(12),author:"kris@knowledgetree.example"},
  {id:"c6",type:"deployed",resourceType:"Deployment",resourceName:"inventory-service",scope:"k8s-prod",description:"Deployed v2.7.3",impact:"high",timestamp:d(1),author:"alex@knowledgetree.example"},
  {id:"c7",type:"created",resourceType:"S3 Bucket",resourceName:"knowledgetree-prod-events-archive",scope:"aws-prod-us-east-1",description:"Archive bucket 90d retention",impact:"low",timestamp:d(1),author:"terraform"},
  {id:"c8",type:"modified",resourceType:"IAM Role",resourceName:"warehouse-sync-role",scope:"aws-prod-us-east-1",description:"Added s3:GetObject",impact:"medium",timestamp:d(1),author:"terraform"},
  {id:"c9",type:"deployed",resourceType:"Deployment",resourceName:"recommendations",scope:"k8s-prod",description:"Deployed v1.9.0",impact:"medium",timestamp:d(2),author:"morgan@knowledgetree.example"},
  {id:"c10",type:"modified",resourceType:"ConfigMap",resourceName:"identity-service-config",scope:"k8s-prod",description:"Token TTL→4h",impact:"high",timestamp:d(2),author:"kris@knowledgetree.example"},
  {id:"c11",type:"created",resourceType:"EKS Node Group",resourceName:"knowledgetree-prod-memory-optimized",scope:"aws-prod-us-east-1",description:"r6g.xlarge node group",impact:"low",timestamp:d(3),author:"terraform"},
  {id:"c12",type:"deleted",resourceType:"RDS Snapshot",resourceName:"orders-postgres-snapshot-2025-02",scope:"aws-prod-us-east-1",description:"Auto-pruned",impact:"low",timestamp:d(3),author:"lifecycle-policy"},
];

export const SCOPES=[
  {id:"scope-aws",name:"AWS Production",type:"aws",config:{regions:["us-east-1","eu-west-1"],accountId:"1234****7890"},enabled:true,lastRun:h(1),resourceCount:812},
  {id:"scope-k8s",name:"Kubernetes knowledgetree-prod",type:"kubernetes",config:{cluster:"knowledgetree-prod",kubeconfig:"k8s-prod"},enabled:true,lastRun:h(1),resourceCount:1247},
  {id:"scope-gcp",name:"GCP BigQuery",type:"gcp",config:{project:"knowledgetree-analytics"},enabled:true,lastRun:h(8),resourceCount:93},
  {id:"scope-github",name:"GitHub knowledgetree org",type:"github",config:{org:"knowledgetree"},enabled:false,lastRun:d(5),resourceCount:48},
];

export const RUNS=[
  {id:"run-001",scope:"scope-aws",status:"completed",startedAt:h(1),completedAt:h(0.9),resourcesFound:812,relationsFound:1493,errors:[]},
  {id:"run-002",scope:"scope-k8s",status:"completed",startedAt:h(1),completedAt:h(0.85),resourcesFound:1247,relationsFound:2118,errors:[]},
  {id:"run-003",scope:"scope-gcp",status:"completed",startedAt:h(8),completedAt:h(7.92),resourcesFound:93,relationsFound:104,errors:[]},
  {id:"run-004",scope:"scope-k8s",status:"completed",startedAt:h(25),completedAt:h(24.88),resourcesFound:1241,relationsFound:2103,errors:[]},
  {id:"run-005",scope:"scope-aws",status:"failed",startedAt:h(25),completedAt:h(24.82),resourcesFound:0,relationsFound:0,errors:["AccessDenied: iam:ListRoles"]},
  {id:"run-006",scope:"scope-github",status:"completed",startedAt:d(5),completedAt:d(4.99),resourcesFound:48,relationsFound:12,errors:[]},
];

export const DOCS_LIST=[
  {id:"doc-web",type:"service",target:"web-gateway",title:"web-gateway",generated:true,updated_at:h(1)},
  {id:"doc-checkout",type:"service",target:"checkout-api",title:"checkout-api",generated:true,updated_at:h(1)},
  {id:"doc-payments",type:"service",target:"payments-service",title:"payments-service",generated:true,updated_at:h(2)},
  {id:"doc-inventory",type:"service",target:"inventory-service",title:"inventory-service",generated:true,updated_at:h(3)},
  {id:"doc-catalog",type:"service",target:"catalog-api",title:"catalog-api",generated:true,updated_at:h(4)},
  {id:"doc-identity",type:"service",target:"identity-service",title:"identity-service",generated:true,updated_at:h(4)},
  {id:"doc-orders",type:"service",target:"orders-service",title:"orders-service",generated:true,updated_at:h(5)},
  {id:"doc-notifications",type:"service",target:"notifications-service",title:"notifications-service",generated:true,updated_at:h(6)},
];

export function getDocPage(id:string){const e=DOCS_LIST.find(d=>d.id===id);if(!e)return null;const s=getSvc(e.target);const deps=s?getDeps(s.name):{upstream:[],downstream:[]};const content=`# ${e.title}\n\n${s?`> ${s.description}\n\n**Team:** ${s.team}  \n**Env:** ${s.environment}  \n**Tier:** ${s.tags.find((t:string)=>t.startsWith("tier-"))??"tier-2"}  \n**Repo:** \`${s.repository}\`  \n**Owner:** ${s.owner}  \n**Lang:** ${s.language}  \n**Health:** ${s.health}  \n**Coverage:** ${s.coverage}%`:`No info`}\n\n## Dependencies\n\n**Upstream:** ${(deps.upstream as any[]).length?(deps.upstream as any[]).map(u=>`- ${u.name}`).join("\n"):"None"}\n\n**Downstream:** ${(deps.downstream as any[]).length?(deps.downstream as any[]).map(d=>`- ${d.name}`).join("\n"):"None"}\n\n_Generated by Knowledge Tree_\n`;return{id:e.id,path:`/docs/${e.target}`,title:e.title,content,lastUpdated:e.updated_at,source:e.type};}

export const RUNBOOKS=[
  {id:"rb-1",service_name:"payments-service",title:"Payments degraded — circuit breaker tripped",content:"1. Check Stripe dashboard.\n2. Verify kafka-events broker lag.\n3. If lag >10k, scale payments-service pods.\n",status:"active",generated:true,updated_at:h(2),tags:["tier-0","payments","incident"]},
  {id:"rb-2",service_name:"orders-postgres",title:"orders-postgres high CPU (>80%)",content:"1. Identify slow queries via pg_stat_statements.\n2. Check missing indexes on order_items.created_at.\n3. If CPU still high, promote replica-2 to primary after notifying #sre.\n",status:"active",generated:true,updated_at:d(1),tags:["database","cpu","runbook"]},
  {id:"rb-3",service_name:"web-gateway",title:"Latency spike on /checkout",content:"1. Verify checkout-api pod count >= minReplicas.\n2. Check fraud-detector queue depth.\n3. If depth >5k, temporarily disable fraud scoring for guest checkouts.\n",status:"active",generated:true,updated_at:h(4),tags:["latency","checkout"]},
];

export const PLUGINS=[
  {id:"p1",name:"Confluence Sync",description:"Auto-syncs service docs to Confluence.",version:"1.3.0",status:"installed",installed_at:h(24)},
  {id:"p2",name:"PagerDuty Integration",description:"Auto-creates incidents for tier-0 alerts.",version:"2.1.0",status:"installed",installed_at:d(2)},
  {id:"p3",name:"Slack Notifier",description:"Posts topology changes to #platform.",version:"1.0.4",status:"installed",installed_at:d(5)},
  {id:"p4",name:"OpenCost Connector",description:"Pulls Kubernetes cost allocation by namespace.",version:"0.9.1",status:"available",installed_at:""},
];

export const CONFLUENCE=[
  {id:"conn-1",name:"Knowledge Tree Wiki",baseUrl:"https://knowledgetree.atlassian.net/wiki",space:"KT",status:"connected",lastSync:h(3)},
];
