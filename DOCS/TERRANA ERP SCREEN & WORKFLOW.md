**TERRANA ERP**

**Screen Specifications & Workflow Requirements**

**Version 1.0**

**GLOBAL APPLICATION LAYOUT**

All modules must follow the same design.  
**Left Sidebar Navigation**

Dashboard  
HR

* Employees  
* Payroll  
* Leave  
* Advances  
* Bonuses

Users  
Suppliers  
Procurement  
Processing  
Inventory

* Pre-Stock  
* Export Inventory

Payments  
Expenses

* Daily Expenses  
* Operational Expenses

Logistics

* Customers  
* Fumigation Chambers  
* Truck Agents  
* Shipments

Reports  
Settings  
**DASHBOARD**

**Purpose**

Provide company-wide overview.  
**KPI Cards**

Total Procurement KG  
Current Inventory KG  
Total Suppliers  
Outstanding Payments  
Containers In Transit  
Monthly Expenses  
Monthly Procurement Value  
Monthly Shipments  
**Charts**

Procurement Trend  
Inventory Trend  
Expense Trend  
Shipment Trend  
**Recent Activity**

Latest Procurements  
Latest Payments  
Latest Shipments  
Latest Expenses  
**EMPLOYEES PAGE**

**Employee List**

Table Columns  
Employee ID  
Name  
Department  
Position  
Status  
Date Hired  
Phone  
Actions  
**Actions**

View  
Edit  
Deactivate  
Archive  
**Add Employee Button**

Opens employee form.  
**Employee Form**

**Personal Information**

First Name  
Last Name  
Phone  
Email  
Address  
Date Hired  
**Employment**

Department  
Position  
Salary  
Employee Type  
Administrative  
Field Staff  
**Guarantor**

Name  
Phone  
Address  
**Documents**

Upload CV  
Upload Employment Letter  
Upload Identification  
**PAYROLL PAGE**

**Table**

Employee  
Salary  
Advances  
Bonuses  
Net Pay  
Status  
Actions  
**LEAVE PAGE**

**Table**

Employee  
Leave Type  
Start Date  
End Date  
Status  
Approved By  
**USERS PAGE**

**User List**

Username  
Employee  
Role  
Status  
Last Login  
**Create User**

Only employees can become users.  
Workflow:  
Select Employee  
↓  
Assign Username  
↓  
Assign Email  
↓  
Assign Role  
↓  
Save  
**SUPPLIER PAGE**

**Supplier List**

Supplier Name  
Status  
Phone  
Total Procurements  
Outstanding Balance  
Actions  
**Add Supplier**

Supplier Information  
Bank Accounts  
Notes  
**Supplier Detail Page**

Tabs:  
Overview  
Bank Accounts  
Procurements  
Payments  
Analytics  
**PROCUREMENT MODULE**

**Procurement Dashboard**

Cards  
Today's Procurements  
Pending Approvals  
Total KG Procured  
Procurement Value  
**Procurement List**

Grouped by Batch Number  
Columns  
Batch Number  
Type  
Product Type  
Supplier  
KG  
Status  
Payment Status  
Date  
Actions  
**New Procurement**

Button  
Create Procurement  
**Procurement Form**

Step 1  
Procurement Type  
On-Site  
Off-Site  
Step 2  
Select Product Type  
Raw  
Clean  
Mixed  
Step 3  
Select Product Details  
New  
Old  
Red  
Black  
Mixed Type  
Step 4  
Select Supplier  
Step 5  
Procurement Data  
Number of Bags  
KG Per Bag  
Extra KG  
Total KG Auto Calculated  
Step 6  
Financial  
Unit Price  
Total Value  
Step 7  
Receiver  
Employee Dropdown  
Step 8  
Notes  
Step 9  
Save  
System Generates:  
Batch Number  
**PROCESSING MODULE**

**Processing Dashboard**

Pending Processing Batches  
Bags In Processing  
Waste Generated  
Yield %  
**Processing Queue**

Only displays:  
Batches requiring processing.  
Columns  
Batch Number  
Product Type  
Supplier  
Remaining Bags  
Date  
Action  
**Start Processing**

Select Batch  
Enter  
Date  
Bags Sent  
Employee  
Save  
**Processing Session Detail**

Input Section  
Bags Sent  
Remaining Bags  
Output Section  
Export Product  
Bags Produced  
KG Per Bag  
Extra KG  
Total KG  
Waste Section  
Broken Flower  
Flower Bulb  
Fungus  
Other  
Button  
Complete Processing  
**Processing History**

Grouped By Batch Number  
Expandable  
Click Batch  
↓  
See All Sessions  
↓  
See Waste  
↓  
See Outputs  
**INVENTORY MODULE**

**PRE-STOCK PAGE**

Displays  
Goods waiting grading.  
Columns  
Pre-Stock Number  
Source Batch  
Product Type  
Bags  
KG  
Date  
Status  
**EXPORT INVENTORY**

Displays final inventory.  
Columns  
Inventory Number  
Product Type  
Bags  
KG  
Status  
Date Graded  
Actions  
**Create Inventory Batch**

Select Multiple Pre-Stock Records  
↓  
Grade  
↓  
Create Inventory  
System Generates  
Inventory Number  
**Inventory Detail Page**

Displays  
Inventory Information  
Source Batches  
Current Status  
Movement History  
**PAYMENTS MODULE**

**Payment Dashboard**

Outstanding Payments  
Partial Payments  
Completed Payments  
**Record Payment**

Only show suppliers with unpaid procurements.  
Step 1  
Select Supplier  
Step 2  
Select Batch  
Step 3  
System Shows  
Batch Value  
Outstanding Amount  
Step 4  
Enter Payment  
Validation  
Cannot exceed balance.  
Step 5  
Payment Method  
Cash  
Transfer  
Step 6  
Approval  
Save  
**Payment History**

Columns  
Reference  
Supplier  
Batch  
Amount  
Date  
Method  
Approved By  
**EXPENSES MODULE**

**Daily Expenses**

Table  
Date  
Category  
Description  
Amount  
Method  
Receipt  
Entered By  
**Add Expense**

Category  
Description  
Amount  
Receipt Upload  
Save  
**Operational Expenses**

Separate Page  
Expense Types  
Cleaning  
Grading  
Field Transfer Out  
Field Transfer In  
Truck Offloading  
Warehouse Loading  
Miscellaneous  
**Create Operational Expense**

Step 1  
Select Expense Type  
Step 2  
System Loads Related Records  
Processing  
Inventory  
Logistics  
Procurement  
Step 3  
Rate Per Bag  
Auto Calculate Total  
Step 4  
Payment Details  
Save  
**CUSTOMER MODULE**

**Customer List**

Customer  
Country  
Fumigation Requirement  
Actions  
**Customer Detail**

Overview  
Shipments  
Documents  
History  
**FUMIGATION CHAMBERS**

Facility List  
Contact  
Address  
Registration Number  
Actions  
**TRUCK AGENTS**

Agent List  
Phone  
Email  
Actions  
**SHIPMENTS MODULE**

**Shipment Dashboard**

Containers In Transit  
Containers Loaded  
Containers Delivered  
**Create Shipment**

Step 1  
Customer  
Step 2  
Truck Agent  
Step 3  
Driver Information  
Driver Name  
Phone  
Truck Plate  
Step 4  
Select Inventory  
Multiple Selection  
Step 5  
Container Information  
Container Number  
Seal Number  
Destination Port  
Step 6  
Weight Verification  
Total KG  
Step 7  
Shipping Details  
Loading Date  
Vessel  
Bill of Lading  
Step 8  
Documents  
Upload  
Loading Videos  
Container Photos  
Shipping Documents  
Certificates  
Save  
**Shipment Detail Page**

Header  
Container Number  
Seal Number  
Customer  
Status  
Tabs  
Inventory Sources  
Documents  
Shipping Information  
Weight Analysis  
History  
**REPORTING MODULE**

Export to:  
Excel  
CSV  
PDF

 Design the database and application architecture to support future multi-product operations.  
Version 1 should only implement the Hibiscus workflow.  
Do not build product-specific modules for other commodities yet.  
However, the architecture should allow future products to have different operational workflows without requiring major redesign of the database or application.  
Reports  
Supplier Performance  
Procurement Analysis  
Processing Yield Analysis  
Waste Analysis  
Inventory Status  
Payment Analysis  
Expense Analysis  
Shipment Analysis  
Customer Analysis  
**FUTURE PHASE 2 MODULES**

Not build yet.  
Reserve menu items:  
Quality Management  
Audit Logs  
SOP Management  
Corrective Actions (CAPA)  
Document Control  
ISO Compliance  
Internal Audits  
Management Reviews

