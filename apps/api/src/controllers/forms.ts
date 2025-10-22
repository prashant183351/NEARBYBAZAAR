import { Request, Response } from 'express';
import { Form } from '../models/Form';
import { FormEntry } from '../models/FormEntry';
import { emailQueue } from '../queues/email';
import { parse } from 'fast-csv';

// Submit a form entry and trigger notification
export async function submitFormEntry(req: Request, res: Response) {
  const { formId, data } = req.body;
  const form = await Form.findById(formId);
  if (!form || form.deleted) return res.status(404).json({ error: 'Form not found' });

  // Save entry
  const entry = await FormEntry.create({ form: formId, data, submittedBy: (req as any).user?.id });

  // Determine recipients (owner, admin, or custom)
  let recipients: string[] = [];
  if (form.metadata?.notifyRecipients) {
    recipients = form.metadata.notifyRecipients;
  } else if (form.ownerType === 'vendor') {
    // Lookup vendor email
    const vendor = await (await import('../models/Vendor')).Vendor.findById(form.owner);
    if (vendor?.email) recipients.push(vendor.email);
  } else if (form.ownerType === 'user') {
    // Lookup user email
    const user = await (await import('../models/User')).User.findById(form.owner);
    if (user?.email) recipients.push(user.email);
  } else {
    recipients.push(process.env.ADMIN_EMAIL || 'admin@nearbybazaar.com');
  }

  // Enqueue email notification (throttled)
  for (const email of recipients) {
    await emailQueue.add('form-submission', {
      to: email,
      subject: `New form submission: ${form.name}`,
      text: `A new entry was submitted for your form. Entry ID: ${entry._id}`,
      html: `<p>A new entry was submitted for your form <b>${form.name}</b>.<br/>Entry ID: ${entry._id}</p>`,
    });
  }

  res.status(201).json({ entry });
}

// Export form entries as CSV
export async function exportFormEntriesCsv(req: Request, res: Response) {
  // RBAC: Only owner or admin can export
  const { formId } = req.params;
  const form = await Form.findById(formId);
  if (!form || form.deleted) return res.status(404).json({ error: 'Form not found' });
  // TODO: Add RBAC check for owner/admin

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="form_${formId}_entries.csv"`);

  const cursor = FormEntry.find({ form: formId, deleted: false }).cursor();
  const csvStream = parse({ headers: true });
  csvStream.pipe(res);

  for await (const entry of cursor) {
    csvStream.write({
      ...entry.data,
      _id: entry._id,
      submittedBy: entry.submittedBy,
      createdAt: entry.createdAt,
    });
  }
  csvStream.end();
}
