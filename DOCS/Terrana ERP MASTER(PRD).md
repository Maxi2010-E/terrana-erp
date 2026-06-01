**Master Product Requirements Document (PRD)**

This is **Version 1.0 of the Terrana ERP Master Product Requirements Document (PRD).**  
**TERRANA ERP**

**Master Product Requirements Document (PRD)**

**Version 1.0**

**1\. PROJECT OVERVIEW**

**Project Name**

Terrana ERP  
**Company**

Terrana Africa Limited  
**Industry**

Agricultural Export  
**Primary Product**

Dried Hibiscus Flowers

 Future Product Expansion Requirement  
Version 1 of Terrana ERP is designed primarily for Dried Hibiscus Flower operations.  
However, the system architecture must support future expansion into additional agricultural products such as Sesame, Soybeans, Ginger, Palm Oil, and other commodities.  
The architecture must therefore be product-aware and workflow-driven.  
Products may have different procurement, processing, quality control, inventory, and logistics workflows.  
Version 1 will only implement the Hibiscus workflow.  
Future versions must allow separate workflow definitions for different products without requiring major database redesign.

**Purpose**

Develop a centralized enterprise management platform that manages and tracks the complete lifecycle of exported agricultural products from supplier procurement to international customer delivery.  
The system shall provide:

* Operational management  
* Traceability  
* Inventory management  
* Financial control  
* Logistics management  
* Staff management

The platform must provide complete visibility of product movement, cost accumulation, supplier performance, inventory status, and shipment execution.  
**2\. CORE OBJECTIVES**

The system must:  
**Objective 1**

Track every kilogram purchased.  
**Objective 2**

Track every kilogram processed.  
**Objective 3**

Track all waste generated.  
**Objective 4**

Track every inventory movement.  
**Objective 5**

Track supplier payments.  
**Objective 6**

Track export shipments.  
**Objective 7**

Track operational costs.  
**Objective 8**

Provide full traceability from supplier to customer.  
**3\. USER ROLES**

**Super Admin**

System owner.  
Permissions:

* Full access  
* Approvals  
* Pricing visibility  
* User management  
* System configuration

**Admin**

Permissions:

* Operational management  
* Procurement approval  
* Payment approval  
* Inventory visibility

**Accounts**

Permissions:

* Payments  
* Expenses  
* Payroll

Restrictions:

* Cannot view confidential supplier pricing unless authorized

**Inventory Manager**

Permissions:

* Processing  
* Inventory  
* Stock movement

**Logistics Manager**

Permissions:

* Shipment management  
* Customer management  
* Truck management

**4\. MODULE 1 — HR MANAGEMENT**

**Purpose**

Maintain complete employee records.  
**Employee Master Record**

Fields:  
**Employee Information**

* Employee ID (Auto Generated)  
* First Name  
* Last Name  
* Phone Number  
* Email  
* Residential Address  
* Date Hired  
* Status  
  * Active  
  * Inactive  
  * On Leave

**Employment Information**

* Department  
  * Administration  
  * Accounts  
  * Inventory  
  * Logistics  
  * Processing  
  * Packaging  
* Employee Type  
  * Administrative  
  * Field Staff  
* Job Title  
* Monthly Salary

**Guarantor Information**

* Full Name  
* Phone Number  
* Address

**Documents**

Upload:

* CV  
* Employment Letter  
* Identification Documents

**Employee Functions**

Track:

* Payroll  
* Leave  
* Advances  
* Bonuses

**MODULE 2 — USER MANAGEMENT**

**Purpose**

Control access to system.  
**User Creation Rules**

A User MUST be linked to an Employee.  
No standalone users allowed.  
**User Fields**

* Username  
* Email  
* Linked Employee  
* Role  
* Status

**Attendance**

Administrative staff attendance automatically recorded through system login.  
Store:

* Login Time  
* Logout Time  
* Date

**MODULE 3 — SUPPLIER MANAGEMENT**

**Supplier Master Record**

Fields:

* Supplier ID  
* Supplier Name  
* Phone  
* Email  
* Address

**Supplier Status**

Active  
Inactive  
Automatic rule:  
If no procurement recorded in 90 days:  
Status \= Inactive  
**Bank Accounts**

Support multiple bank accounts.  
Each account stores:

* Bank Name  
* Account Number  
* Account Name

**Notes**

Free text notes.  
**MODULE 4 — PROCUREMENT MANAGEMENT**

**Procurement Types**

**On-Site Procurement**

Supplier processes goods under company supervision.  
**Off-Site Procurement**

Goods purchased externally.  
**Product Classification Engine**

**Level 1**

Product Condition

* Raw  
* Clean  
* Mixed

**Level 2**

Product Age

* New  
* Old

**Level 3**

Color

* Red  
* Black

**Mixed Products**

* Red Mixed  
* Black Mixed  
* Combined Mixed

**Final Product Type**

System auto-generates final classification.  
Examples:

* Clean New Red  
* Raw Old Black  
* Combined Mixed

**Procurement Record**

Fields:

* Batch Number (Auto Generated)  
* Procurement Type  
* Product Type  
* Supplier  
* Date  
* Receiver

**On-Site Fields**

* Number of Bags  
* KG Per Bag  
* Extra KG  
* Total KG

Auto-calculated.  
**Off-Site Fields**

* Number of Bags  
* Total KG

Optional:

* KG Per Bag

**Pricing**

* Unit Price  
* Total Value

Auto-calculated.  
**Approval Flow**

Accounts enters procurement.  
Admin approves pricing.  
**Visibility Rules**

Admin:  
Can view prices.  
Accounts:  
Cannot view prices.  
**MODULE 5 — PROCESSING MANAGEMENT**

**Purpose**

Manage conversion of raw goods into exportable goods.  
**Processing Queue**

Automatically populated from:

* Raw Procurement  
* Rejected Clean Procurement

**Processing Session**

Fields:

* Session Number  
* Date  
* Source Batch  
* Bags Sent

**Output Recording**

**Exportable Product**

* Bags Produced  
* KG Per Bag  
* Extra KG  
* Total KG

**Waste Recording**

Categories:

* Broken Flower  
* Flower Bulb  
* Fungus  
* Other Waste

All measured in KG.  
**Processing Completion**

Output automatically transferred to:  
Pre-Stock  
**MODULE 6 — WASTE MANAGEMENT**

Dedicated waste database.  
Track:

* Waste Source Batch  
* Waste Type  
* Quantity  
* Date Generated

Purpose:  
Future reprocessing and sales.  
**MODULE 7 — INVENTORY MANAGEMENT**

**Pre-Stock**

Stores:  
Qualified goods awaiting grading.  
**Export Inventory**

Stores:  
Final export-ready inventory.  
**Grading Process**

Select one or multiple pre-stock batches.  
Create:  
New Inventory Batch  
**Inventory Batch Fields**

* Inventory Number  
* Product Type  
* Bags  
* Total KG  
* Date Graded  
* Status

**Source Tracking**

Inventory record stores source pre-stock batches.  
Full traceability maintained.  
**MODULE 8 — SUPPLIER PAYMENTS**

**Payment Queue**

Automatically populated.  
Only unpaid procurements appear.  
**Payment Record**

Fields:

* Payment Reference  
* Supplier  
* Batch Number  
* Amount  
* Date  
* Method

Methods:

* Cash  
* Transfer

**Validation**

System prevents overpayment.  
**Status**

* Unpaid  
* Partially Paid  
* Paid

**MODULE 9 — EXPENSE MANAGEMENT**

**Expense Categories**

**Daily Expenses**

Categories:

* Utilities  
* Repairs  
* Maintenance  
* Office Supplies  
* Others

**Daily Expense Fields**

* Date  
* Category  
* Description  
* Amount  
* Payment Method  
* Receipt Upload  
* Notes

**Petty Cash**

Track:

* Cash Added  
* Cash Balance  
* Approver

**MODULE 10 — OPERATIONAL COST MANAGEMENT**

Categories:  
**Cleaning Cost**

Linked to Processing Session.  
**Grading Cost**

Linked to Inventory Creation.  
**Field Transfer Out**

Processing Transfer.  
**Field Transfer In**

Warehouse Transfer.  
**Truck Offloading**

Linked to Off-Site Procurement.  
**Warehouse Loading**

Linked to Shipment.  
**Miscellaneous Cost**

Manual entry.  
**MODULE 11 — CUSTOMER MANAGEMENT**

Fields:

* Customer Name  
* Country  
* Contact Person  
* Phone  
* Email

**Communication Requirement**

Options:

* Requires Fumigation  
* No Fumigation Required

**MODULE 12 — FUMIGATION CHAMBERS**

Fields:

* Facility Name  
* Address  
* Contact Person  
* Phone  
* Registration Number

**MODULE 13 — TRUCK AGENTS**

Fields:

* Agent Name  
* Phone  
* Email  
* Address

**MODULE 14 — LOGISTICS MANAGEMENT**

**Shipment Creation**

Fields:

* Customer  
* Truck Agent  
* Driver Name  
* Driver Phone  
* Truck Plate Number

**Inventory Selection**

Select inventory batches.  
System records source inventory.  
**Container Information**

* Container Number  
* Seal Number  
* Total KG  
* Destination Port

**Shipping Information**

* Loading Date  
* Bill of Lading Number  
* Vessel Name  
* Vessel Number

**Document Uploads**

Store:

* Loading Videos  
* Container Photos  
* Shipping Documents  
* Fumigation Certificates

**MODULE 15 — DASHBOARD**

**CEO Dashboard**

Display:  
**Procurement**

* Total KG Purchased  
* Total Procurement Value

**Processing**

* Total Processed  
* Yield Percentage

**Waste**

* Waste Generated

**Inventory**

* Current Stock

**Payments**

* Outstanding Supplier Payments

**Logistics**

* Containers In Transit

**Expenses**

* Daily Expenses  
* Operational Expenses

