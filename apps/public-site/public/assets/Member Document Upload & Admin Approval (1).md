# Story: Member Document Upload & Admin Approval

## Goal

Allow a **Member to upload documents** and allow an **Admin to review, approve, or reject** those documents.

The system already has an existing **Media Service**. The new functionality must use the existing Media Service for actual file upload and storage.

The existing **`AuditableDomainBase`** must be reused for the new Domain. Do not create duplicate audit fields.

---

## 1. Database Domain

### Document

Create a `Document` Domain to maintain the documents that a Member can upload.

Example:

```text
Id
Name
Description
IsActive
```

Examples:

```text
ID Proof
Address Proof
Passport
Bank Statement
```

`Document` must inherit from the existing `AuditableDomainBase`.

Do not add audit properties such as `CreatedAt`, `UpdatedAt`, etc. manually if they are already provided by `AuditableDomainBase`.

---

### MemberDocument

Create `MemberDocument` to maintain the relationship between a Member and their uploaded document.

Example:

```text
Id
MemberId
DocumentId
MediaId
Status
RejectionReason
UploadedAt
ReviewedAt
ReviewedBy
```

`MemberDocument` must also inherit from the existing `AuditableDomainBase`.

Relationships:

```text
Document
   |
   | DocumentId
   ↓
MemberDocument
   |
   | MediaId
   ↓
Existing Media Service
```

`MediaId` represents the file uploaded through the existing Media Service.

---

## 2. Member Upload Flow

The Member should be able to upload a document.

### Flow

1. Member gets the available active `Document` records.
2. Member selects the required document.
3. Member selects a file.
4. Member Document API calls the existing **Media Service** to upload the file.
5. Media Service returns the `MediaId`.
6. Create a `MemberDocument` record.
7. Set the initial status to `Pending`.

```text
Member
   ↓
Member Document API
   ↓
Existing Media Service
   ↓
MediaId
   ↓
MemberDocument
   ↓
Pending
```

The Member Document service must **not implement its own file-storage functionality**.

---

## 3. Member Document List

Provide an API for a Member to view their uploaded documents.

The response should contain:

- Document name
- Media/file information
- Uploaded date
- Current status
- Rejection reason, if applicable

A Member must only be able to access their own documents.

---

## 4. Admin Review

Admin should be able to view Member documents that are waiting for approval.

### Approve

When Admin approves the document:

```text
Status = Approved
ReviewedBy = Current Admin
ReviewedAt = Current Time
```

### Reject

When Admin rejects the document:

```text
Status = Rejected
RejectionReason = Required
ReviewedBy = Current Admin
ReviewedAt = Current Time
```

`RejectionReason` is mandatory when rejecting a document.

---

## 5. Status Flow

```text
Pending
   ├──> Approved
   └──> Rejected
```

If a rejected document needs to be uploaded again, create a new `MemberDocument` record according to the existing business requirement.

---

## 6. APIs

### Member APIs

```text
GET  /documents
POST /member-documents
GET  /member-documents
```

### Admin APIs

```text
GET  /admin/member-documents
POST /admin/member-documents/{id}/approve
POST /admin/member-documents/{id}/reject
```

Follow the existing project's API, authorization, service, and naming conventions.

---

## 7. Media Service Integration

Use the **existing Media Service** for uploading the document.

Do not:

- Create another media/file table.
- Store the actual file in the Member service.
- Duplicate Media Service functionality.

The expected flow is:

```text
Upload Request
      ↓
Member Document API
      ↓
Media Service
      ↓
File Stored
      ↓
MediaId returned
      ↓
MemberDocument created
```

If Media Service upload fails, `MemberDocument` should not be created with an invalid or missing `MediaId`.

---

## 8. Domain & EF Core Rules

- Use the existing `AuditableDomainBase` for `Document` and `MemberDocument`.
- Do not duplicate audit properties.
- Follow the existing Domain Configuration pattern.
- Configure `Document` and `MemberDocument` using `IDomainTypeConfiguration`.
- `MemberDocument` must have a relationship with `Document`.
- `MemberDocument` must store the `MediaId` returned by Media Service.
- Only active `Document` records can be selected for upload.
- New Member Documents must have `Pending` status.
- Only authorized Admin users can approve/reject documents.
- Rejection reason is mandatory when rejecting.
- Member can only access their own documents.

---

## 9. Acceptance Criteria

- [ ] `Document` Domain is created.
- [ ] `MemberDocument` Domain is created.
- [ ] Both Domain use the existing `AuditableDomainBase`.
- [ ] No duplicate audit fields are added.
- [ ] Admin/system can maintain active documents available for Member upload.
- [ ] Member can retrieve active documents.
- [ ] Member can upload a document.
- [ ] File is uploaded through the existing Media Service.
- [ ] `MediaId` is saved in `MemberDocument`.
- [ ] New `MemberDocument` starts with `Pending` status.
- [ ] Member can view their uploaded documents.
- [ ] Admin can view pending Member Documents.
- [ ] Admin can approve a document.
- [ ] Admin can reject a document.
- [ ] Rejection requires a reason.
- [ ] Reviewer and review timestamp are stored.
- [ ] Actual file storage remains the responsibility of the existing Media Service.