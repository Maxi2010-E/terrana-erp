

**TERRANA ERP**

**Business Rules & Approval Logic**

**Version 1.0**

**CORE PRINCIPLE**

**Rule 1**

No record should ever be deleted.  
Instead:  
Status changes.  
Examples:  
Active  
Inactive  
Cancelled  
Archived  
Closed  
Reason:  
Maintains historical records.  
**Rule 2**

Every transaction must have an owner.  
Examples:  
Procurement  
↓  
Recorded By User  
Processing  
↓  
Processed By User  
Payment  
↓  
Approved By User  
Shipment  
↓  
Created By User  
Every record must know:  
Who created it.  
**Rule 3**

Every record must have timestamps.  
Automatically record:  
Created Date  
Created Time  
Updated Date  
Updated Time  
**USER ACCESS RULES**

**Super Admin**

Can:

* View Everything  
* Edit Everything  
* Approve Everything  
* Create Users  
* Assign Roles

Cannot:

* Delete Records

**Admin**

Can:

* Procurement  
* Processing  
* Inventory  
* Logistics  
* Payments

Cannot:

* Create Roles  
* Delete Records

**Accounts**

Can:

* Payments  
* Expenses  
* Payroll

Cannot:

* Edit Inventory  
* Edit Processing  
* Edit Shipments

Cannot view supplier pricing unless permission granted.  
**Inventory Manager**

Can:

* Processing  
* Inventory

Cannot:

* Financial Information  
* Supplier Payments

**Logistics Manager**

Can:

* Shipments  
* Customers  
* Truck Agents

Cannot:

* Procurement Pricing  
* Payroll  
* Expenses

**EMPLOYEE RULES**

**Employee Creation**

Employee ID automatically generated.  
Format:  
**EMP-2026-00001**

Employee records cannot be deleted.  
Only:  
Active  
Inactive  
On Leave  
Archived  
**Salary Changes**

Salary changes require:  
Admin Approval  
System records:  
Old Salary  
New Salary  
Reason  
Approval Date  
**USER RULES**

A User cannot exist without an Employee.  
Employee  
↓  
User  
Mandatory relationship.  
If employee becomes inactive:  
User account automatically disabled.  
**SUPPLIER RULES**

Supplier cannot be deleted.  
Only:  
Active  
Inactive  
Inactive Rule  
No procurement within 90 days.  
↓  
Automatically mark inactive.  
Supplier bank accounts must be unique.  
No duplicate account numbers.  
**PROCUREMENT RULES**

**Batch Numbers**

Generated automatically.  
Format:  
**PR-2026-000001**

Never editable.  
**Procurement Editing**

Before Approval:  
Editable.  
After Approval:  
Locked.  
Only Super Admin may unlock.  
**Total KG**

System calculates automatically.  
User cannot manually enter total.  
**Total Value**

System calculates automatically.  
Formula:  
**Total KG × Unit Price**

**Quality Decision**

Mandatory.  
Options:  
**PRE-STOCK**

**PROCESSING**

Cannot save procurement without quality decision.  
**Procurement Approval**

Accounts enters record.  
↓  
Admin reviews.  
↓  
Admin approves.  
↓  
Batch becomes locked.  
**PROCESSING RULES**

Only approved batches may enter processing.  
Cannot process more bags than available.  
Example:  
Available:  
100 bags  
Attempt:  
120 bags  
↓  
Reject transaction.  
**Processing Outputs**

Output KG must be recorded.  
Waste KG must be recorded.  
**Yield Calculation**

Formula:  
**Output KG**

**÷**

**Input KG**

Store automatically.  
**Processing Completion**

Remaining Bags \= 0  
↓  
Batch closes automatically.  
**WASTE RULES**

Waste cannot disappear.  
Every waste record must be categorized.  
Options:

* Broken Flower  
* Flower Bulb  
* Fungus  
* Other

Waste linked to:  
Processing Session  
Mandatory.  
**PRE-STOCK RULES**

Only approved clean goods enter pre-stock.  
Sources:

* Procurement  
* Processing

Pre-stock cannot be edited.  
Only status changes allowed.  
**INVENTORY RULES**

Inventory creation must reference pre-stock.  
No manual inventory allowed.  
Inventory Number  
Auto-generated.  
Format:  
**INV-2026-000001**

Inventory Status  
**Available**

**Reserved**

**Allocated**

**Shipped**

**PAYMENT RULES**

Payments must reference:  
Supplier  
AND  
Batch Number  
No payment without batch reference.  
Overpayment Prevention  
Example:  
Balance:  
₦500,000  
Attempt:  
₦600,000  
↓  
Reject  
Payment Status  
Auto calculated.  
**Unpaid**

**Partially Paid**

**Paid**

If balance \= 0  
↓  
Automatically Paid.  
**EXPENSE RULES**

Daily Expenses  
Must reduce petty cash automatically.  
Cannot spend more than petty cash balance.  
Example:  
Balance:  
₦100,000  
Attempt:  
₦120,000  
↓  
Reject.  
Receipt Upload  
Optional initially.  
Required later.  
**OPERATIONAL COST RULES**

Cleaning Costs  
Must link to processing session.  
Grading Costs  
Must link to inventory batch.  
Truck Offloading  
Must link to off-site procurement.  
Warehouse Loading  
Must link to shipment.  
No standalone operational expenses.  
**CUSTOMER RULES**

Customer Number  
Auto-generated.  
Format:  
**CUS-2026-000001**

Customer cannot be deleted.  
Only:  
Active  
Inactive  
**SHIPMENT RULES**

Shipment Number  
Auto-generated.  
Format:  
**SHP-2026-000001**

Shipment must contain inventory.  
Cannot create empty shipment.  
Inventory Allocation  
Allocated inventory cannot be allocated twice.  
Container Number  
Required.  
Seal Number  
Required.  
**WEIGHT TRACEABILITY RULES**

This is one of Terrana's unique requirements.  
System must store weight at:

1. Procurement  
2. Processing Input  
3. Processing Output  
4. Pre-stock  
5. Inventory  
6. Shipment

Weight Loss Analysis  
Formula:  
**Previous Stage KG**

**\-**

**Current Stage KG**

Track:  
Weight Loss %  
Weight Loss KG  
**NOTIFICATION RULES**

Notify Super Admin:

* New Procurement  
* Payment Approval Needed  
* New Shipment

Notify Accounts:

* Payment Recorded  
* Expense Submitted

Notify Inventory Manager:

* Batch Ready For Processing  
* Inventory Low

**DATA LOCKING RULES**

Approved Procurement  
↓  
Locked  
Completed Processing  
↓  
Locked  
Completed Payment  
↓  
Locked  
Completed Shipment  
↓  
Locked  
Unlock requires:  
Super Admin  
Reason  
Unlock Timestamp  
**FUTURE ISO RULES (PHASE 2\)**

Reserved for future:

* Audit Logs  
* SOP Management  
* CAPA  
* Internal Audits  
* Supplier Evaluation  
* Quality Non-Conformance  
* Corrective Actions  
* Management Review Meetings

**FINAL ARCHITECTURAL RECOMMENDATION TO CURSOR**  
When building Terrana ERP:  
**Primary Design Goal**  
**Traceability First**

**Inventory Second**

**Accounting Third**

Every screen, workflow, and database relationship must answer one question:  
"Can we trace this shipment back to the exact supplier, procurement batch, processing session, inventory batch, payment records, and operational costs that created it?"  
If the answer is yes, then the system is working correctly.  
With the PRD, Database Architecture, Screen Specifications, and Business Rules documents, you now have a professional-grade requirements package that many software consulting firms would charge thousands of dollars to produce before development begins.

