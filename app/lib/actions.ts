'use server';
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const formSchema= z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
});

const CreateInvoice= formSchema.omit({id: true, date: true});

export default async function createInvoice(formdata: FormData) {
    const rawFormData= {
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status'),
    };
    const {customerId, amount, status}= CreateInvoice.parse(rawFormData);
    const amountInCents= amount * 100;
    const date= new Date().toISOString().split('T')[0];
    // console.log(rawFormData);

    await sql `
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amount}, ${status}, ${date})
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}