**TERRANA ERP**

**Technical Architecture & Database Design v1.0**

**SYSTEM ARCHITECTURE**

**Frontend**

Framework:

* Next.js 15  
* TypeScript  
* Tailwind CSS  
* ShadCN UI

Requirements:

* Mobile responsive  
* Desktop optimized  
* Dark mode ready  
* Fast loading

**Backend**

Platform:  
Supabase  
Services:

* PostgreSQL Database  
* Authentication  
* Storage  
* Realtime Notifications  
* Row Level Security

**CORE SYSTEM PRINCIPLE**

Every record must be traceable.  
Nothing exists independently.  
Every record must be connected.  
Example:  
Shipment  
↓  
Inventory Batch  
↓  
Pre-stock Batch  
↓  
Processing Session  
↓  
Procurement Batch  
↓  
Supplier  
**DATABASE STRUCTURE**

**TABLE 1**

**employees**

Stores all employee records.  
Fields:  
**id UUID**

**employee\_id**

**first\_name**

**last\_name**

**phone**

**email**

**address**

**hire\_date**

**status**

**employee\_type**

**department**

**job\_title**

**monthly\_salary**

**guarantor\_name**

**guarantor\_phone**

**guarantor\_address**

**cv\_url**

**created\_at**

**updated\_at**

**TABLE 2**

**employee\_leave**

**id**

**employee\_id**

**leave\_type**

**start\_date**

**end\_date**

**reason**

**status**

**approved\_by**

**created\_at**

**TABLE 3**

**employee\_advances**

**id**

**employee\_id**

**amount**

**date\_issued**

**reason**

**status**

**approved\_by**

**TABLE 4**

**employee\_bonuses**

**id**

**employee\_id**

**amount**

**reason**

**approved\_by**

**date\_awarded**

**TABLE 5**

**users**

**id**

**employee\_id**

**username**

**email**

**role**

**status**

**last\_login**

**TABLE 6**

**attendance**

**id**

**user\_id**

**login\_time**

**logout\_time**

**attendance\_date**

**TABLE 7**

**suppliers**

**id**

**supplier\_code**

**supplier\_name**

**phone**

**email**

**address**

**status**

**notes**

**created\_at**

**TABLE 8**

**supplier\_bank\_accounts**

**id**

**supplier\_id**

**bank\_name**

**account\_number**

**account\_name**

One supplier  
↓  
Many bank accounts  
**PROCUREMENT**

**TABLE 9**

**procurement\_batches**

**id**

**batch\_number**

**procurement\_type**

**product\_type**

**supplier\_id**

**number\_of\_bags**

**kg\_per\_bag**

**extra\_kg**

**total\_kg**

**unit\_price**

**total\_value**

**procurement\_date**

**received\_by**

**quality\_decision**

**payment\_status**

**status**

**notes**

Quality Decision  
**PRE\_STOCK**

**PROCESSING**

**Processing**

**TABLE 10**

**processing\_sessions**

**id**

**session\_number**

**source\_batch\_id**

**processing\_date**

**bags\_sent**

**bags\_remaining**

**processed\_by**

**notes**

**TABLE 11**

**processing\_outputs**

**id**

**processing\_session\_id**

**bags\_produced**

**kg\_per\_bag**

**extra\_kg**

**total\_kg**

**TABLE 12**

**waste\_records**

**id**

**processing\_session\_id**

**waste\_type**

**weight\_kg**

**date\_recorded**

Waste Types  
**broken\_flower**

**flower\_bulb**

**fungus**

**other**

**PRE-STOCK**

**TABLE 13**

**pre\_stock**

**id**

**pre\_stock\_number**

**source\_type**

**source\_id**

**product\_type**

**bags**

**total\_kg**

**date\_received**

**status**

Source Type  
**procurement**

**processing**

**INVENTORY**

**TABLE 14**

**inventory\_batches**

**id**

**inventory\_number**

**product\_type**

**bags**

**total\_kg**

**date\_graded**

**status**

**TABLE 15**

**inventory\_sources**

Many-to-many relationship.  
Tracks:  
Which pre-stock records created inventory.  
**id**

**inventory\_batch\_id**

**pre\_stock\_id**

**PAYMENTS**

**TABLE 16**

**supplier\_payments**

**id**

**payment\_reference**

**supplier\_id**

**batch\_id**

**amount**

**payment\_method**

**payment\_date**

**approved\_by**

**status**

Status  
**paid**

**partial**

**pending**

**PETTY CASH**

**TABLE 17**

**petty\_cash**

**id**

**amount\_added**

**current\_balance**

**added\_by**

**date\_added**

**DAILY EXPENSES**

**TABLE 18**

**daily\_expenses**

**id**

**expense\_category**

**description**

**amount**

**payment\_method**

**receipt\_url**

**notes**

**entered\_by**

**expense\_date**

**OPERATIONAL EXPENSES**

**TABLE 19**

**operational\_expenses**

**id**

**expense\_type**

**linked\_record**

**bags**

**rate\_per\_bag**

**total\_amount**

**payment\_method**

**notes**

**paid\_by**

**expense\_date**

Expense Types  
**cleaning**

**grading**

**field\_transfer\_out**

**field\_transfer\_in**

**truck\_offloading**

**warehouse\_loading**

**miscellaneous**

**CUSTOMERS**

**TABLE 20**

**customers**

**id**

**customer\_name**

**country**

**contact\_person**

**phone**

**email**

**fumigation\_required**

**FUMIGATION CHAMBERS**

**TABLE 21**

**fumigation\_chambers**

**id**

**facility\_name**

**address**

**contact\_person**

**phone**

**registration\_number**

**TRUCK AGENTS**

**TABLE 22**

**truck\_agents**

**id**

**agent\_name**

**phone**

**email**

**address**

**SHIPMENTS**

**TABLE 23**

**shipments**

**id**

**shipment\_number**

**customer\_id**

**truck\_agent\_id**

**driver\_name**

**driver\_phone**

**truck\_plate\_number**

**container\_number**

**seal\_number**

**destination\_port**

**total\_kg**

**loading\_date**

**bill\_of\_lading**

**vessel\_name**

**vessel\_number**

**shipment\_status**

**TABLE 24**

**shipment\_inventory**

Tracks inventory loaded.  
**id**

**shipment\_id**

**inventory\_batch\_id**

**DOCUMENTS**

**TABLE 25**

**shipment\_documents**

**id**

**shipment\_id**

**document\_type**

**file\_url**

**uploaded\_by**

**uploaded\_at**

Document Types  
**loading\_video**

**container\_photo**

**fumigation\_certificate**

**shipping\_document**

**other**

**NOTIFICATION ENGINE**

Create notifications for:  
**Procurement**

* New procurement recorded  
* Procurement awaiting approval

**Payments**

* Payment awaiting approval  
* Partial payment outstanding

**Inventory**

* Low stock alert

**Logistics**

* Shipment created  
* Shipment completed

**ROLE PERMISSIONS**

**Super Admin**

Everything  
**Admin**

Everything except user role management  
**Accounts**

Can:

* Payments  
* Expenses  
* Payroll

Cannot:

* View procurement prices

**Inventory Manager**

Can:

* Processing  
* Inventory

Cannot:

* Financial records

**Logistics Manager**

Can:

* Customers  
* Shipments  
* Truck Agents

Cannot:

* Procurement pricing

**UI DESIGN REQUIREMENTS**

Based on the screenshots from your Base44 system:  
Requirements:

* Left sidebar navigation  
* KPI cards on dashboard  
* Large data tables  
* Filters  
* Search  
* Export to Excel  
* Mobile responsive

**IMPORTANT CURSOR INSTRUCTION**

After building the database:  
DO NOT build all modules simultaneously.  
Build sequentially:  
Phase 1:

* HR  
* Users

Phase 2:

* Suppliers

Phase 3:

* Procurement

Phase 4:

* Processing

Phase 5:

* Inventory

Phase 6:

* Payments

Phase 7:

* Expenses

Phase 8:

* Logistics

Phase 9:

* Dashboards

Only after Phase 9 is complete should we add:

* Audit Logs  
* SOP Management  
* CAPA (Corrective Actions)  
* Quality Management  
* ISO Compliance Layer

