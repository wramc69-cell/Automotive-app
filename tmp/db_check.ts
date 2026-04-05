import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log("Checking appointments table...")
    const { data, error } = await supabase.from('appointments').select('*').limit(1)
    if (error) {
        console.error("Error fetching appointments:", error)
    } else {
        console.log("Found columns in appointments:", Object.keys(data[0] || {}))
    }

    console.log("Checking service_requests table...")
    const { data: reqs, error: rError } = await supabase.from('service_requests').select('*').limit(1)
    if (rError) {
        console.error("Error fetching requests:", rError)
    } else {
        console.log("Found columns in service_requests:", Object.keys(reqs[0] || {}))
    }
}

checkSchema()
